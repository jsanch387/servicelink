import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  OFFLINE_SESSION_PAYMENT_METHODS,
  type OfflineSessionPaymentMethod,
} from '../transactions/constants';
import { PAYMENTS_REVENUE_OFFLINE_ROW_CAP } from './constants';
import type { RevenueEvent } from './summarizeRevenue';

interface OfflineRevenueRow {
  session_payment_method?: string | null;
  session_payment_amount_cents?: number | null;
  session_payment_recorded_at?: string | null;
}

export type LoadOfflineRevenueResult =
  | { ok: true; events: RevenueEvent[] }
  | { ok: false };

export async function loadOfflineRevenuePayments(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    fromIso: string;
    toIso: string;
  }
): Promise<LoadOfflineRevenueResult> {
  const { data, error } = await fromTable(supabase, 'booking_payments')
    .select(
      'session_payment_method, session_payment_amount_cents, session_payment_recorded_at'
    )
    .eq('business_id', args.businessId)
    .in('session_payment_method', [...OFFLINE_SESSION_PAYMENT_METHODS])
    .gt('session_payment_amount_cents', 0)
    .gte('session_payment_recorded_at', args.fromIso)
    .lte('session_payment_recorded_at', args.toIso)
    .order('session_payment_recorded_at', { ascending: true })
    .limit(PAYMENTS_REVENUE_OFFLINE_ROW_CAP);

  if (error) {
    console.error(
      '[payments:revenue] load offline booking_payments failed',
      error
    );
    return { ok: false };
  }

  const events: RevenueEvent[] = [];
  for (const row of (data ?? []) as OfflineRevenueRow[]) {
    const method = row.session_payment_method?.trim();
    const recordedAt = row.session_payment_recorded_at?.trim() ?? '';
    const amountCents = Number(row.session_payment_amount_cents ?? 0);
    if (!isOfflineMethod(method) || amountCents <= 0 || !recordedAt) continue;
    const createdAt = new Date(recordedAt).toISOString();
    if (Number.isNaN(Date.parse(createdAt))) continue;
    events.push({
      createdAt,
      amountCents,
      source: method,
    });
  }

  return { ok: true, events };
}

function isOfflineMethod(
  value: string | undefined
): value is OfflineSessionPaymentMethod {
  return value === 'cash' || value === 'payment_app' || value === 'other';
}

function fromTable(supabase: SupabaseClient<Database>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-maintained Database types
  return (supabase as unknown as SupabaseClient<any>).from(table);
}
