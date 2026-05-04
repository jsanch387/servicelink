import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingConfirmationDispatchClaim =
  | 'claimed'
  | 'duplicate'
  | 'skipped';

/**
 * Idempotency for Supabase webhook retries: first successful insert wins.
 * Create table (run in Supabase SQL editor):
 *
 * create table if not exists public.booking_confirmation_dispatch (
 *   booking_id uuid primary key references public.bookings(id) on delete cascade,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.booking_confirmation_dispatch enable row level security;
 * -- Service role bypasses RLS; no policies needed for server-only use.
 */
export async function tryClaimBookingConfirmationDispatch(
  supabase: SupabaseClient<Database>,
  bookingId: string
): Promise<BookingConfirmationDispatchClaim> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('booking_confirmation_dispatch')
    .insert({ booking_id: bookingId });

  if (!error) {
    return 'claimed';
  }

  const code = (error as { code?: string }).code;
  if (code === '23505') {
    return 'duplicate';
  }

  console.warn(
    '[booking_confirmation_dispatch] insert failed (idempotency); proceeding without ledger',
    { code, message: (error as Error).message }
  );
  return 'skipped';
}
