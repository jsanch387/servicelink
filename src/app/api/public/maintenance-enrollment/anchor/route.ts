/**
 * POST /api/public/maintenance-enrollment/anchor
 *
 * Customer sets first-visit date/time when the owner left them blank.
 */

import {
  checkMaintenanceAnchorAgainstCalendar,
  maintenanceSlotAvailabilityUserMessage,
} from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { loadPublicMaintenanceEnrollmentByToken } from '@/features/maintenance/server/loadPublicMaintenanceEnrollment';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim().slice(0, 5));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      anchorDate?: string;
      anchorTime?: string;
    };
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    const anchorDate =
      typeof body.anchorDate === 'string' ? body.anchorDate.trim() : '';
    const anchorTime =
      typeof body.anchorTime === 'string'
        ? body.anchorTime.trim().slice(0, 5)
        : '';

    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Link is required.' },
        { status: 400 }
      );
    }

    if (!isIsoDate(anchorDate) || !isTimeHHmm(anchorTime)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please choose a valid date and time.',
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const enrollment = await loadPublicMaintenanceEnrollmentByToken(
      db,
      rawToken
    );
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'This link is invalid.' },
        { status: 404 }
      );
    }

    if (enrollment.status !== 'enrolled_pending_customer') {
      return NextResponse.json(
        {
          success: false,
          error: 'This plan can no longer be updated here.',
        },
        { status: 409 }
      );
    }

    if (hasMaintenanceAnchorScheduled(enrollment)) {
      return NextResponse.json(
        { success: false, error: 'A first visit date is already set.' },
        { status: 409 }
      );
    }

    const durationMinutes = Math.max(
      1,
      Math.round(Number(enrollment.duration_minutes ?? 60))
    );
    const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
      businessId: enrollment.business_id,
      anchorDate,
      anchorTime,
      durationMinutes,
    });
    if (!slotCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: maintenanceSlotAvailabilityUserMessage(slotCheck.reason),
        },
        { status: 409 }
      );
    }

    const { error: updateError } = await db
      .from('maintenance_enrollments')
      .update({
        anchor_date: anchorDate,
        anchor_time: anchorTime,
      })
      .eq('id', enrollment.id)
      .eq('status', 'enrolled_pending_customer');

    if (updateError) {
      console.error('[maintenance-anchor] update failed', updateError);
      return NextResponse.json(
        { success: false, error: 'Could not save your visit time.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error.';
    console.error('[maintenance-anchor] POST failed', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
