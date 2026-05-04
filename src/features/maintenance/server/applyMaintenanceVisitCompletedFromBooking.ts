/**
 * When an owner marks a booking complete, sync maintenance enrollment + customer
 * visit counter so the next invite cycle can run cleanly.
 *
 * Idempotent: only increments when `maintenance_enrollments.initial_booking_id`
 * still points at this booking (single successful update).
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingRowForMaintenanceSideEffect = {
  id: string;
  business_id: string;
  customer_id: string | null;
};

async function incrementCustomerMaintenanceVisits(
  db: SupabaseClient<Database>,
  businessId: string,
  customerId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = db as any;
  const { data: row, error: loadErr } = await raw
    .from('customers')
    .select('maintenance_visits_completed')
    .eq('id', customerId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (loadErr) {
    console.error(
      '[maintenance] increment visits: load customer',
      loadErr,
      customerId
    );
    return;
  }

  const current = Math.max(
    0,
    Math.round(
      Number(
        (row as { maintenance_visits_completed?: number } | null)
          ?.maintenance_visits_completed ?? 0
      )
    )
  );

  const { error: updErr } = await raw
    .from('customers')
    .update({ maintenance_visits_completed: current + 1 })
    .eq('id', customerId)
    .eq('business_id', businessId);

  if (updErr) {
    console.error(
      '[maintenance] increment visits: update customer',
      updErr,
      customerId
    );
  }
}

/**
 * Call with a service client that can update `maintenance_enrollments` and `customers`
 * (typically the admin client from API routes).
 */
export async function applyMaintenanceVisitCompletedFromBooking(
  supabase: SupabaseClient<Database>,
  booking: BookingRowForMaintenanceSideEffect
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const businessId = booking.business_id?.trim();
  const bookingId = booking.id?.trim();
  if (!businessId || !bookingId) return;

  const nowIso = new Date().toISOString();

  const { data: updatedRows, error: updEnrollErr } = await db
    .from('maintenance_enrollments')
    .update({
      status: 'visit_completed',
      initial_booking_id: null,
      last_visit_completed_at: nowIso,
    })
    .eq('business_id', businessId)
    .eq('initial_booking_id', bookingId)
    .select('id, customer_id');

  if (updEnrollErr) {
    console.error(
      '[maintenance] complete booking: update enrollment',
      updEnrollErr,
      bookingId
    );
    return;
  }

  const touched = (updatedRows ?? []) as Array<{
    id: string;
    customer_id: string;
  }>;

  if (touched.length === 0) {
    return;
  }

  const customerId = touched[0]?.customer_id?.trim();
  if (!customerId) return;

  await incrementCustomerMaintenanceVisits(db, businessId, customerId);
}
