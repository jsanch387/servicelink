import type { SupabaseClient } from '@supabase/supabase-js';

/** True once this business has any appointment, practice or customer. */
export async function businessHasAnyBooking(
  supabase: SupabaseClient,
  businessId: string
): Promise<boolean> {
  // bookings is not in the hand-written Database type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select('id')
    .eq('business_id', businessId)
    .limit(1);

  if (error || !data) return false;
  return data.length > 0;
}

/** The practice checklist step is done once any appointment exists. */
export async function businessHasTestBooking(
  supabase: SupabaseClient,
  businessId: string
): Promise<boolean> {
  return businessHasAnyBooking(supabase, businessId);
}
