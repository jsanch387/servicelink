import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  OFFLINE_SESSION_PAYMENT_METHODS,
  type OfflineSessionPaymentMethod,
} from './constants';
import type { OfflineSessionPaymentRow } from './mapOfflineSessionPayment';

export type LoadOfflineSessionPaymentsResult =
  | { ok: true; rows: OfflineSessionPaymentRow[]; hasMore: boolean }
  | { ok: false };

interface BookingPaymentLookup {
  id?: string;
  booking_id?: string;
  session_payment_method?: string | null;
  session_payment_amount_cents?: number | null;
  session_payment_recorded_at?: string | null;
  currency?: string | null;
}

interface BookingLookup {
  id?: string;
  customer_name?: string | null;
  service_name?: string | null;
  job_details?: unknown;
}

export async function loadOfflineSessionPayments(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    limit: number;
    beforeIso?: string;
  }
): Promise<LoadOfflineSessionPaymentsResult> {
  const fetchLimit = Math.max(1, args.limit) + 1;
  let query = fromTable(supabase, 'booking_payments')
    .select(
      'id, booking_id, session_payment_method, session_payment_amount_cents, session_payment_recorded_at, currency'
    )
    .eq('business_id', args.businessId)
    .in('session_payment_method', [...OFFLINE_SESSION_PAYMENT_METHODS])
    .gt('session_payment_amount_cents', 0)
    .not('session_payment_recorded_at', 'is', null)
    .order('session_payment_recorded_at', { ascending: false })
    .limit(fetchLimit);

  if (args.beforeIso) {
    query = query.lt('session_payment_recorded_at', args.beforeIso);
  }

  const { data, error } = await query;
  if (error) {
    console.error(
      '[payments:transactions] load offline booking_payments failed',
      error
    );
    return { ok: false };
  }

  const raw = (data ?? []) as BookingPaymentLookup[];
  const hasMore = raw.length > args.limit;
  const page = hasMore ? raw.slice(0, args.limit) : raw;

  const bookingIds = unique(
    page.map(row => String(row.booking_id ?? '').trim()).filter(Boolean)
  );
  const bookings = await loadBookings(supabase, args.businessId, bookingIds);

  const rows: OfflineSessionPaymentRow[] = [];
  for (const row of page) {
    const id = String(row.id ?? '').trim();
    const bookingId = String(row.booking_id ?? '').trim();
    const method = row.session_payment_method?.trim();
    const recordedAt = row.session_payment_recorded_at?.trim() ?? '';
    const amountCents = Number(row.session_payment_amount_cents ?? 0);
    if (!id || !bookingId || !isOfflineMethod(method) || amountCents <= 0) {
      continue;
    }

    const booking = bookings.get(bookingId);
    rows.push({
      id,
      bookingId,
      method,
      amountCents,
      currency: row.currency?.trim() || 'usd',
      recordedAt,
      customerName: booking?.customer_name?.trim() || null,
      serviceName: booking?.service_name?.trim() || null,
      jobDetails: booking?.job_details,
    });
  }

  return { ok: true, rows, hasMore };
}

function isOfflineMethod(
  value: string | undefined
): value is OfflineSessionPaymentMethod {
  return value === 'cash' || value === 'payment_app' || value === 'other';
}

async function loadBookings(
  supabase: SupabaseClient<Database>,
  businessId: string,
  bookingIds: string[]
): Promise<Map<string, BookingLookup>> {
  const map = new Map<string, BookingLookup>();
  if (bookingIds.length === 0) return map;

  const { data, error } = await fromTable(supabase, 'bookings')
    .select('id, customer_name, service_name, job_details')
    .eq('business_id', businessId)
    .in('id', bookingIds);

  if (error) {
    console.error(
      '[payments:transactions] load bookings for offline payments failed',
      error
    );
    return map;
  }

  for (const row of (data ?? []) as BookingLookup[]) {
    const id = String(row.id ?? '').trim();
    if (id) map.set(id, row);
  }
  return map;
}

function fromTable(supabase: SupabaseClient<Database>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-maintained Database types
  return (supabase as unknown as SupabaseClient<any>).from(table);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
