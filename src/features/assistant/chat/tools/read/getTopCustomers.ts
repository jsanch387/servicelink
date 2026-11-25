import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

import { resolveChatPeriodRange } from './chatPeriodRange';

export const TOP_CUSTOMER_PERIODS = ['month', 'year', 'all'] as const;
export type TopCustomerPeriod = (typeof TOP_CUSTOMER_PERIODS)[number];

export type GetTopCustomersResult =
  | {
      ok: true;
      period: TopCustomerPeriod;
      customers: Array<{
        name: string;
        visitCount: number;
        spendCents: number;
        spendLabel: string;
        lastVisitAt: string | null;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetTopCustomers(args: {
  businessId: string;
  limit?: number;
  period?: TopCustomerPeriod;
  now?: Date;
}): Promise<GetTopCustomersResult> {
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 10);
  const period = args.period ?? 'all';

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const [customerResult, bookingResult] = await Promise.all([
      db
        .from('customers')
        .select('id, full_name')
        .eq('business_id', args.businessId),
      db
        .from('bookings')
        .select(
          'customer_id, service_name, service_price_cents, addon_details, scheduled_date, start_time, status, created_at'
        )
        .eq('business_id', args.businessId)
        .eq('status', 'completed')
        .not('customer_id', 'is', null),
    ]);

    if (customerResult.error || bookingResult.error) {
      console.error('[assistant:chat] getTopCustomers', {
        customerResult: customerResult.error,
        bookingResult: bookingResult.error,
      });
      return { ok: false, error: 'Could not load top customers right now.' };
    }

    let bookings = (bookingResult.data ?? []) as BookingRowForCustomerMetrics[];
    if (period !== 'all') {
      const range = resolveChatPeriodRange({ period, now: args.now });
      bookings = bookings.filter(
        row =>
          row.scheduled_date >= range.fromYmd &&
          row.scheduled_date <= range.toYmd
      );
    }

    const metrics = aggregateBookingsPerCustomer(bookings);
    const names = new Map(
      (
        (customerResult.data ?? []) as Array<{
          id: string;
          full_name: string | null;
        }>
      ).map(customer => [customer.id, customer.full_name?.trim() || 'Customer'])
    );

    const customers = [...metrics.entries()]
      .map(([id, metric]) => ({
        name: names.get(id) || 'Customer',
        visitCount: metric.totalVisits,
        spendCents: metric.totalSpentCents,
        spendLabel: formatPaymentDollars(metric.totalSpentCents),
        lastVisitAt: metric.lastVisitScheduledDate,
      }))
      .filter(customer => customer.spendCents > 0 || customer.visitCount > 0)
      .sort((a, b) => b.spendCents - a.spendCents || b.visitCount - a.visitCount)
      .slice(0, limit);

    return { ok: true, period, customers };
  } catch (error) {
    console.error('[assistant:chat] getTopCustomers', error);
    return { ok: false, error: 'Could not load top customers right now.' };
  }
}
