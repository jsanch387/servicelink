import { quoteTableColumnsFromServiceLocation } from '@/features/quotes/public-view/quoteRespondAddress';
import {
  validateQuoteRespondRequest,
  type ValidatedQuoteRespondRequest,
} from '@/features/quotes/public-view/validateQuoteRespondRequest';
import {
  finalizeApprovedQuoteToBooking,
  revertQuoteToRespondableState,
  type BusinessProfileForQuoteApproval,
} from '@/features/quotes/server/quoteApprovalSideEffects';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import {
  publicBookingSlotValidationMessage,
  validateOwnerBookingSlot,
} from '@/features/availability/booking/server/validateOwnerBookingSlot';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function mergeLegacyServiceAddressNote(
  existingNote: string | null | undefined,
  serviceAddress: string
): string {
  const n = existingNote?.trim() ?? '';
  return n
    ? `${n}\n\nService address: ${serviceAddress}`
    : `Service address: ${serviceAddress}`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = validateQuoteRespondRequest(await request.json());
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const { token, decision } = parsed.data as {
      token: string;
      decision: 'approve' | 'decline';
    };

    const tokenHash = resolveQuoteTokenHash(token);
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const nowIso = new Date().toISOString();

    const { data: linkRow, error: linkError } = await db
      .from('quote_public_links')
      .select('id, quote_id, is_active, revoked_at, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (linkError || !linkRow) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    const link = linkRow as {
      id: string;
      quote_id: string;
      is_active: boolean;
      revoked_at: string | null;
      expires_at: string;
    };

    if (!link.is_active || link.revoked_at || link.expires_at <= nowIso) {
      return NextResponse.json(
        { success: false, error: 'Link is no longer valid' },
        { status: 410 }
      );
    }

    const { data: quoteRow, error: quoteError } = await db
      .from('quotes')
      .select('*')
      .eq('id', link.quote_id)
      .maybeSingle();

    if (quoteError || !quoteRow) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    const q = quoteRow as Record<string, unknown>;
    const quoteId = String(q.id);
    const status = String(q.status ?? '');
    const bookingIdExisting =
      (q.booking_id as string | null | undefined) ?? null;

    if (decision === 'decline') {
      if (status === 'approved') {
        return NextResponse.json(
          { success: false, error: 'This quote was already accepted' },
          { status: 409 }
        );
      }
      if (status === 'declined') {
        return NextResponse.json({
          success: true,
          status: 'declined',
          alreadyResponded: true,
        });
      }
      if (!['sent', 'viewed'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'This quote cannot be responded to' },
          { status: 400 }
        );
      }

      const { error: updateQuoteError } = await db
        .from('quotes')
        .update({
          status: 'declined',
          declined_at: nowIso,
        })
        .eq('id', quoteId);

      if (updateQuoteError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update quote' },
          { status: 500 }
        );
      }

      const { error: updateLinkError } = await db
        .from('quote_public_links')
        .update({
          response_status: 'declined',
          responded_at: nowIso,
        })
        .eq('id', link.id);

      if (updateLinkError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record response' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, status: 'declined' });
    }

    const { address, displayLine, schedule } = parsed.data as Extract<
      ValidatedQuoteRespondRequest,
      { decision: 'approve' }
    >;

    const quoteHasSchedule = Boolean(
      String(q.scheduled_date ?? '').trim() &&
        String(q.scheduled_start_time ?? '').trim()
    );

    if (!quoteHasSchedule && !schedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Choose a date and time to accept this quote',
        },
        { status: 400 }
      );
    }

    // approve
    if (status === 'approved' && bookingIdExisting) {
      return NextResponse.json({
        success: true,
        status: 'approved',
        alreadyResponded: true,
      });
    }

    const { data: profileRaw, error: profileError } = await db
      .from('business_profiles')
      .select(
        'id, profile_id, business_slug, business_name, free_bookings_count'
      )
      .eq('id', q.business_id)
      .maybeSingle();

    if (profileError || !profileRaw) {
      return NextResponse.json(
        { success: false, error: 'Business not found for this quote' },
        { status: 500 }
      );
    }

    const businessProfile = profileRaw as BusinessProfileForQuoteApproval;

    if (status === 'approved' && !bookingIdExisting) {
      const done = await finalizeApprovedQuoteToBooking(admin, {
        quoteRow: q,
        respondAddressFallback: address,
        linkId: link.id,
        nowIso,
        businessProfile,
      });
      if (!done.ok) {
        return NextResponse.json(
          { success: false, error: done.message },
          { status: done.httpStatus }
        );
      }
      return NextResponse.json({ success: true, status: 'approved' });
    }

    if (status === 'declined') {
      return NextResponse.json(
        { success: false, error: 'This quote was already declined' },
        { status: 409 }
      );
    }

    if (!['sent', 'viewed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'This quote cannot be responded to' },
        { status: 400 }
      );
    }

    const slotDate =
      schedule?.scheduledDate?.trim() || String(q.scheduled_date ?? '').trim();
    const slotTime = quoteStartTimeToHHmm(
      schedule?.scheduledStartTimeForDb ??
        (q.scheduled_start_time as string | null | undefined)
    );
    const durationMinutes = Math.max(
      1,
      Math.round(Number(q.duration_minutes ?? 60))
    );
    const slotCheck = await validateOwnerBookingSlot(admin, {
      businessId: String(q.business_id),
      scheduledDate: slotDate,
      startTimeHHmm: slotTime,
      durationMinutes,
    });
    if (!slotCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: publicBookingSlotValidationMessage(slotCheck.code),
        },
        { status: 409 }
      );
    }

    const previousStatus = status as 'sent' | 'viewed';

    const primaryUpdate: Record<string, unknown> = {
      status: 'approved',
      approved_at: nowIso,
      ...quoteTableColumnsFromServiceLocation(address),
    };
    if (!quoteHasSchedule && schedule) {
      primaryUpdate.scheduled_date = schedule.scheduledDate;
      primaryUpdate.scheduled_start_time = schedule.scheduledStartTimeForDb;
    }

    let { data: won, error: approveErr } = await db
      .from('quotes')
      .update(primaryUpdate)
      .eq('id', quoteId)
      .in('status', ['sent', 'viewed'])
      .select('*')
      .maybeSingle();

    if (approveErr) {
      const legacyNote = mergeLegacyServiceAddressNote(
        q.note as string | null | undefined,
        displayLine
      );
      const legacyUpdate: Record<string, unknown> = {
        status: 'approved',
        approved_at: nowIso,
        note: legacyNote,
      };
      if (!quoteHasSchedule && schedule) {
        legacyUpdate.scheduled_date = schedule.scheduledDate;
        legacyUpdate.scheduled_start_time = schedule.scheduledStartTimeForDb;
      }
      const legacyRes = await db
        .from('quotes')
        .update(legacyUpdate)
        .eq('id', quoteId)
        .in('status', ['sent', 'viewed'])
        .select('*')
        .maybeSingle();
      won = legacyRes.data;
      approveErr = legacyRes.error ?? null;
    }

    if (approveErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    if (!won) {
      const { data: again } = await db
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .maybeSingle();
      const ag = again as Record<string, unknown> | null;
      const agBooking = (ag?.booking_id as string | null | undefined) ?? null;
      if (agBooking) {
        return NextResponse.json({
          success: true,
          status: 'approved',
          alreadyResponded: true,
        });
      }
      if (String(ag?.status ?? '') === 'approved' && !agBooking) {
        const done = await finalizeApprovedQuoteToBooking(admin, {
          quoteRow: ag!,
          respondAddressFallback: address,
          linkId: link.id,
          nowIso,
          businessProfile,
        });
        if (!done.ok) {
          return NextResponse.json(
            { success: false, error: done.message },
            { status: done.httpStatus }
          );
        }
        return NextResponse.json({ success: true, status: 'approved' });
      }
      return NextResponse.json(
        { success: false, error: 'Could not approve this quote' },
        { status: 409 }
      );
    }

    const wonRow = won as Record<string, unknown>;
    const done = await finalizeApprovedQuoteToBooking(admin, {
      quoteRow: wonRow,
      respondAddressFallback: address,
      linkId: link.id,
      nowIso,
      businessProfile,
    });

    if (!done.ok) {
      await revertQuoteToRespondableState(admin, quoteId, previousStatus);
      return NextResponse.json(
        { success: false, error: done.message },
        { status: done.httpStatus }
      );
    }

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (e) {
    console.error('[API] POST /api/quotes/respond', e);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
