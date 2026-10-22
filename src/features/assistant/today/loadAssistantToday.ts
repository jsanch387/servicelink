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
  type AssistantInvoiceInput,
  type AssistantQuoteInput,
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
 * Computes today's brief and action items when the owner opens Assistant.
 * Writes nothing. Past skip/send rows hide a person until a newer undo.
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
    quoteResult,
    invoiceResult,
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
    db
      .from('quotes')
      .select(
        'id, customer_name, customer_email, customer_phone, service_name, price_cents, sent_at, created_at'
      )
      .eq('business_id', businessId)
      .in('status', ['sent', 'viewed']),
    db
      .from('invoices')
      .select(
        'id, customer_name, customer_email, customer_phone, total_cents, due_on, sent_at, created_at, short_code'
      )
      .eq('business_id', businessId)
      .eq('status', 'sent'),
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

  if (quoteResult.error) {
    console.error('[assistant] quotes load failed', quoteResult.error);
  }
  if (invoiceResult.error) {
    console.error('[assistant] invoices load failed', invoiceResult.error);
  }

  return buildAssistantToday({
    customers: customerInputs,
    quotes: quoteResult.error ? [] : quotesFrom(quoteResult.data),
    invoices: invoiceResult.error
      ? []
      : invoicesFrom(invoiceResult.data, appBaseUrl()),
    actions,
    bookingUrl: bookingUrl(profile),
    now,
  });
}

type QuoteRow = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  service_name: string | null;
  price_cents: number | null;
  sent_at: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_cents: number | null;
  due_on: string | null;
  sent_at: string | null;
  created_at: string;
  short_code: string | null;
};

function quotesFrom(data: unknown): AssistantQuoteInput[] {
  return ((data ?? []) as QuoteRow[]).flatMap(row => {
    if (!row.id || typeof row.price_cents !== 'number') return [];
    const sentOn = dateOnly(row.sent_at || row.created_at);
    if (!sentOn) return [];
    return [
      {
        id: row.id,
        customerName: row.customer_name?.trim() || '',
        phone: row.customer_phone,
        email: row.customer_email,
        amountCents: row.price_cents,
        serviceName: row.service_name,
        daysWaiting: daysSinceDateString(sentOn),
      },
    ];
  });
}

function invoicesFrom(data: unknown, baseUrl: string): AssistantInvoiceInput[] {
  return ((data ?? []) as InvoiceRow[]).flatMap(row => {
    if (!row.id || typeof row.total_cents !== 'number') return [];
    const sentOn = dateOnly(row.sent_at || row.created_at);
    if (!sentOn) return [];
    const dueOn = dateOnly(row.due_on);
    const code = row.short_code?.trim();
    return [
      {
        id: row.id,
        customerName: row.customer_name?.trim() || '',
        phone: row.customer_phone,
        email: row.customer_email,
        amountCents: row.total_cents,
        daysSinceSent: daysSinceDateString(sentOn),
        daysOverdue: dueOn === null ? null : signedDaysSince(dueOn),
        payUrl: code ? `${baseUrl}/b/${encodeURIComponent(code)}` : null,
      },
    ];
  });
}

function signedDaysSince(isoDate: string, now = new Date()): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const start = new Date(year || 1970, (month || 1) - 1, day || 1);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.round(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function dateOnly(value: string | null): string | null {
  if (!value) return null;
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
  ).replace(/\/$/, '');
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
