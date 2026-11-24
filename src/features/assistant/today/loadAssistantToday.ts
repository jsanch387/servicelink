import { getBusinessBookPath } from '@/constants/routes';
import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { bookingSlotSortKey } from '@/features/customer-management/utils/bookingSlotLocal';
import { daysSinceDateString } from '@/features/customer-management/utils/daysSinceDateString';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildAssistantToday,
  emptyAssistantToday,
  type AssistantActionInput,
  type AssistantCustomerInput,
  type AssistantToday,
} from './buildAssistantToday';

type CustomerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type BookingRow = BookingRowForCustomerMetrics & {
  id: string;
};

type ActionRow = {
  id: string;
  customer_id: string | null;
  kind: string;
  subject: string;
  created_at: string;
};

/**
 * Computes today's assistant action items when the owner opens Assistant.
 * Reviews + check-ins only for now. Writes nothing.
 */
export async function loadAssistantToday(
  supabase: SupabaseClient,
  businessId: string,
  now: Date = new Date()
): Promise<AssistantToday> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [
    profileResult,
    customerResult,
    bookingResult,
    reviewResult,
    actionResult,
  ] = await Promise.all([
    db
      .from('business_profiles')
      .select('business_slug, business_link')
      .eq('id', businessId)
      .maybeSingle(),
    db
      .from('customers')
      .select('id, full_name, phone, email')
      .eq('business_id', businessId),
    db
      .from('bookings')
      .select(
        'id, customer_id, service_name, service_price_cents, addon_details, scheduled_date, start_time, status, created_at'
      )
      .eq('business_id', businessId)
      .not('customer_id', 'is', null),
    db.from('reviews').select('customer_id').eq('business_id', businessId),
    db
      .from('assistant_actions')
      .select('id, customer_id, kind, subject, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
  ]);

  const failed = [
    profileResult.error,
    customerResult.error,
    bookingResult.error,
    reviewResult.error,
    actionResult.error,
  ].find(Boolean);

  if (failed) {
    console.error('[assistant] today load failed', failed);
    return emptyAssistantToday(now);
  }

  const customers = (customerResult.data ?? []) as CustomerRow[];
  const bookings = (bookingResult.data ?? []) as BookingRow[];
  const reviewed = new Set<string>(
    ((reviewResult.data ?? []) as { customer_id: string | null }[])
      .map(row => row.customer_id)
      .filter((id): id is string => Boolean(id))
  );
  const names = new Map(
    customers.map(customer => [customer.id, customer.full_name?.trim() || ''])
  );
  const metrics = aggregateBookingsPerCustomer(bookings);
  const latestBookingId = latestCompletedBookingIds(bookings);

  const customerInputs: AssistantCustomerInput[] = customers.map(customer => {
    const metric = metrics.get(customer.id);
    const lastVisitDate = metric?.lastVisitScheduledDate ?? null;
    return {
      id: customer.id,
      fullName: customer.full_name?.trim() || '',
      phone: customer.phone,
      email: customer.email,
      lastVisitDaysAgo: lastVisitDate
        ? daysSinceDateString(lastVisitDate)
        : null,
      lastVisitOn: lastVisitDate,
      lastVisitBookingId: latestBookingId.get(customer.id) ?? null,
      hasUpcomingAppointment: Boolean(metric?.nextAppointmentScheduledDate),
      hasReview: reviewed.has(customer.id),
    };
  });

  const actions: AssistantActionInput[] = (
    (actionResult.data ?? []) as ActionRow[]
  ).map(action => ({
    id: action.id,
    customerId: action.customer_id,
    customerName: action.customer_id
      ? names.get(action.customer_id) || null
      : null,
    kind: action.kind,
    subject: action.subject,
    createdAt: action.created_at,
  }));

  const profile = profileResult.data as {
    business_slug: string | null;
    business_link: string | null;
  } | null;

  return buildAssistantToday({
    customers: customerInputs,
    actions,
    bookingUrl: bookingUrl(profile),
    now,
  });
}

function latestCompletedBookingIds(
  rows: readonly BookingRow[]
): Map<string, string> {
  const latest = new Map<string, { id: string; sort: string }>();

  for (const row of rows) {
    if (row.status !== 'completed' || !row.customer_id) continue;
    const sort = bookingSlotSortKey(row.scheduled_date, row.start_time);
    const current = latest.get(row.customer_id);
    if (!current || sort >= current.sort) {
      latest.set(row.customer_id, { id: row.id, sort });
    }
  }

  return new Map(
    [...latest].map(([customerId, value]) => [customerId, value.id])
  );
}

function bookingUrl(
  profile: { business_slug: string | null; business_link: string | null } | null
): string {
  const link = profile?.business_link?.trim();
  if (link) {
    return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  }
  const slug = profile?.business_slug?.trim();
  if (!slug) return '';
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
  ).replace(/\/$/, '');
  return `${base}${getBusinessBookPath(slug)}`;
}
