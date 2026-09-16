import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from './adminDb';

export type UpdateBookingAssigneeResult =
  | { ok: true; assignedUserId: string | null }
  | { ok: false; error: string; status: number };

/** Sets or clears `bookings.assigned_user_id`. DB trigger enforces owner/member. */
export async function updateBookingAssignee(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    bookingId: string;
    assignedUserId: string | null;
  }
): Promise<UpdateBookingAssigneeResult> {
  const { data, error } = await adminDb(admin)
    .from('bookings')
    .update({ assigned_user_id: params.assignedUserId })
    .eq('id', params.bookingId)
    .eq('business_id', params.businessId)
    .select('id, assigned_user_id')
    .maybeSingle();

  if (error) {
    if (error.code === '23514') {
      return {
        ok: false,
        error: 'That person is not on this shop.',
        status: 400,
      };
    }
    return { ok: false, error: 'Could not update assignee', status: 500 };
  }

  if (!data?.id) {
    return { ok: false, error: 'Booking not found', status: 404 };
  }

  const assignedUserId =
    typeof data.assigned_user_id === 'string' && data.assigned_user_id.trim()
      ? data.assigned_user_id.trim()
      : null;

  return { ok: true, assignedUserId };
}
