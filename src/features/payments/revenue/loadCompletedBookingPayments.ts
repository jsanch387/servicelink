import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RevenueBookingRow } from './computeBookingEarningsCents';

const PAGE_SIZE = 1000;
const PAGE_CAP = 50;

const SELECT = [
  'id',
  'scheduled_date',
  'start_time',
  'status',
  'service_name',
  'customer_name',
  'job_details',
  'visit_job_count',
  'service_price_cents',
  'addon_details',
  'subtotal_cents',
  'discount_cents',
  'booking_payments ( total_amount_cents, paid_online_amount_cents, session_fees_total_cents, session_payment_amount_cents, remaining_amount_cents, session_payment_method, session_payment_recorded_at )',
].join(', ');

export type LoadCompletedBookingPaymentsResult =
  | { ok: true; rows: RevenueBookingRow[] }
  | { ok: false };

export async function loadCompletedBookingPayments(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    fromYmd?: string | null;
    toYmd?: string | null;
  }
): Promise<LoadCompletedBookingPaymentsResult> {
  const rows: RevenueBookingRow[] = [];
  try {
    for (let page = 0; page < PAGE_CAP; page += 1) {
      let query = fromTable(supabase, 'bookings')
        .select(SELECT)
        .eq('business_id', args.businessId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (args.fromYmd) {
        query = query.gte('scheduled_date', args.fromYmd);
      }
      if (args.toYmd) {
        query = query.lte('scheduled_date', args.toYmd);
      }

      const { data, error } = await query;
      if (error) {
        console.error(
          '[payments:revenue] load completed bookings failed',
          error
        );
        return { ok: false };
      }

      const batch = (data ?? []) as RevenueBookingRow[];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return { ok: true, rows };
  } catch (e) {
    console.error('[payments:revenue] load completed bookings failed', e);
    return { ok: false };
  }
}

function fromTable(supabase: SupabaseClient<Database>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-maintained Database types
  return (supabase as unknown as SupabaseClient<any>).from(table);
}
