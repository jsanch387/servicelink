import { notifyAssigneeForJobAssigned } from '@/features/team/server/notifyAssigneeForJobAssigned';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { updateBookingAssignee } from '@/features/team/server/updateBookingAssignee';
import { parseAssignedUserId } from '@/features/team/utils/parseAssignedUserId';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id?.trim();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!('assignedUserId' in body)) {
      return NextResponse.json(
        { success: false, error: 'Provide assignedUserId (user id or null).' },
        { status: 400 }
      );
    }

    const parsed = parseAssignedUserId(body.assignedUserId);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'bookings.read'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const result = await updateBookingAssignee(admin, {
      businessId: resolved.businessId,
      bookingId,
      assignedUserId: parsed.assignedUserId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    await notifyAssigneeForJobAssigned({
      admin,
      businessId: resolved.businessId,
      bookingId,
      actorUserId: auth.user.id,
      previousAssignedUserId: result.previousAssignedUserId,
      nextAssignedUserId: result.assignedUserId,
    });

    return NextResponse.json({
      success: true,
      assignedUserId: result.assignedUserId,
    });
  } catch (error) {
    console.error(
      '[team] PATCH /api/availability/bookings/[id]/assignee',
      error
    );
    return NextResponse.json(
      { success: false, error: 'Could not update assignee' },
      { status: 500 }
    );
  }
}
