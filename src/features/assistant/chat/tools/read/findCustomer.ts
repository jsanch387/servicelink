import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type FindCustomerResult =
  | {
      ok: true;
      customers: Array<{
        id: string;
        name: string;
        phoneMasked: string | null;
        emailMasked: string | null;
        lastVisitAt: string | null;
        lastServiceName: string | null;
        hasReview: boolean;
        upcomingBooking: string | null;
        visitCount: number;
        spendLabel: string;
      }>;
    }
  | { ok: false; error: string };

function maskPhone(phone: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 4) return phone?.trim() || null;
  return `•••${digits.slice(-4)}`;
}

function maskEmail(email: string | null): string | null {
  const value = email?.trim() ?? '';
  const at = value.indexOf('@');
  if (at < 1) return value || null;
  return `${value[0]}•••${value.slice(at)}`;
}

export async function executeFindCustomer(args: {
  businessId: string;
  query: string;
  limit?: number;
}): Promise<FindCustomerResult> {
  const query = args.query.trim().toLowerCase();
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 10);
  if (!query) {
    return { ok: false, error: 'Provide a name, phone, or email to search.' };
  }

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const [customerResult, bookingResult, reviewResult] = await Promise.all([
      db
        .from('customers')
        .select('id, full_name, phone, email')
        .eq('business_id', args.businessId),
      db
        .from('bookings')
        .select(
          'customer_id, service_name, service_price_cents, addon_details, scheduled_date, start_time, status, created_at'
        )
        .eq('business_id', args.businessId)
        .not('customer_id', 'is', null),
      db
        .from('reviews')
        .select('customer_id')
        .eq('business_id', args.businessId),
    ]);

    if (customerResult.error || bookingResult.error || reviewResult.error) {
      console.error('[assistant:chat] findCustomer', {
        customerResult: customerResult.error,
        bookingResult: bookingResult.error,
        reviewResult: reviewResult.error,
      });
      return { ok: false, error: 'Could not search customers right now.' };
    }

    const reviewed = new Set<string>(
      ((reviewResult.data ?? []) as { customer_id: string | null }[])
        .map(row => row.customer_id)
        .filter((id): id is string => Boolean(id))
    );

    const metrics = aggregateBookingsPerCustomer(
      (bookingResult.data ?? []) as BookingRowForCustomerMetrics[]
    );

    const matches = (
      (customerResult.data ?? []) as Array<{
        id: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
      }>
    )
      .filter(customer => {
        const name = (customer.full_name ?? '').toLowerCase();
        const phone = (customer.phone ?? '').toLowerCase();
        const email = (customer.email ?? '').toLowerCase();
        return (
          name.includes(query) || phone.includes(query) || email.includes(query)
        );
      })
      .slice(0, limit)
      .map(customer => {
        const metric = metrics.get(customer.id);
        return {
          id: customer.id,
          name: customer.full_name?.trim() || 'Customer',
          phoneMasked: maskPhone(customer.phone),
          emailMasked: maskEmail(customer.email),
          lastVisitAt: metric?.lastVisitScheduledDate ?? null,
          lastServiceName: metric?.lastVisitServiceName || null,
          hasReview: reviewed.has(customer.id),
          upcomingBooking: metric?.nextAppointmentScheduledDate ?? null,
          visitCount: metric?.totalVisits ?? 0,
          spendLabel: formatPaymentDollars(metric?.totalSpentCents ?? 0),
        };
      });

    return { ok: true, customers: matches };
  } catch (error) {
    console.error('[assistant:chat] findCustomer', error);
    return { ok: false, error: 'Could not search customers right now.' };
  }
}
