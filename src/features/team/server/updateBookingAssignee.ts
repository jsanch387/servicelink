import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canChangeBookingAssignee } from '../utils/canChangeBookingAssignee';
import { adminDb } from './adminDb';

export type UpdateBookingAssigneeResult =
  | {
      ok: true;
      assignedUserId: string | null;
      previousAssignedUserId: string | null;
    }
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
  const db = adminDb(admin);
  const { data: existing, error: loadError } = await db
    .from('bookings')
    .select('id, status, assigned_user_id')
    .eq('id', params.bookingId)
    .eq('business_id', params.businessId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: 'Could not update assignee', status: 500 };
  }
  if (!existing?.id) {
    return { ok: false, error: 'Booking not found', status: 404 };
  }
  const previousAssignedUserId =
    typeof existing.assigned_user_id === 'string' &&
    existing.assigned_user_id.trim()
      ? existing.assigned_user_id.trim()
      : null;

  if (!canChangeBookingAssignee(String(existing.status ?? ''))) {
    return {
      ok: false,
      error: 'Completed appointments can’t change assignee.',
      status: 409,
    };
  }

  const { data, error } = await db
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

  return { ok: true, assignedUserId, previousAssignedUserId };
}
