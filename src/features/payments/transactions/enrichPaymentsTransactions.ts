import { membershipPlansOf } from '@/features/subscriptions/server/membershipTablesQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { applyPaymentsTransactionDisplay } from './applyPaymentsTransactionDisplay';
import type { MappedPaymentsTransaction } from './mapStripeBalanceTransaction';
import {
  isUnusablePaymentsTransactionTitle,
  resolvePaymentsTransactionBookingTitle,
} from './resolvePaymentsTransactionBookingTitle';

interface PaymentRequestLookup {
  id: string;
  note: string | null;
  collection_method: string | null;
  stripe_payment_intent_id: string | null;
}

interface BookingLookup {
  id: string;
  customer_name: string | null;
  service_name: string | null;
  job_details?: unknown;
}

export async function enrichPaymentsTransactions(
  supabase: SupabaseClient<Database>,
  businessId: string,
  items: MappedPaymentsTransaction[]
): Promise<MappedPaymentsTransaction[]> {
  if (items.length === 0) return items;

  const paymentIntentIds = unique(
    items.map(item => item.refs.paymentIntentId).filter(Boolean) as string[]
  );
  const paymentRequestIds = unique(
    items.map(item => item.refs.paymentRequestId).filter(Boolean) as string[]
  );
  const bookingIds = new Set(
    items.map(item => item.refs.bookingId).filter(Boolean) as string[]
  );
  const checkoutSessionRowIds = unique(
    items
      .map(item => item.refs.bookingCheckoutSessionRowId)
      .filter(Boolean) as string[]
  );

  const membershipPlanIds = unique(
    items.map(item => item.refs.membershipPlanId).filter(Boolean) as string[]
  );

  const [paymentRequests, tapToPayIntents, checkoutSessions, membershipPlans] =
    await Promise.all([
      loadPaymentRequests(supabase, businessId, {
        paymentRequestIds,
        paymentIntentIds,
      }),
      loadBookingTapToPayIntents(supabase, businessId, paymentIntentIds),
      loadBookingCheckoutSessions(supabase, businessId, {
        checkoutSessionRowIds,
        paymentIntentIds,
      }),
      loadMembershipPlans(supabase, businessId, membershipPlanIds),
    ]);

  for (const intent of tapToPayIntents.values()) {
    bookingIds.add(intent.bookingId);
  }
  for (const session of checkoutSessions.values()) {
    if (session.bookingId) bookingIds.add(session.bookingId);
  }

  const bookings = await loadBookings(supabase, businessId, [...bookingIds]);

  return items.map(item =>
    applyPaymentsTransactionDisplay(
      overlayItem(item, {
        paymentRequests,
        tapToPayIntents,
        checkoutSessions,
        bookings,
        membershipPlans,
      })
    )
  );
}

function overlayItem(
  item: MappedPaymentsTransaction,
  lookups: {
    paymentRequests: Map<string, PaymentRequestLookup>;
    tapToPayIntents: Map<string, { bookingId: string }>;
    checkoutSessions: Map<string, { bookingId: string | null }>;
    bookings: Map<string, BookingLookup>;
    membershipPlans: Map<string, string>;
  }
): MappedPaymentsTransaction {
  const next = { ...item };
  const request =
    (item.refs.paymentRequestId &&
      lookups.paymentRequests.get(item.refs.paymentRequestId)) ||
    (item.refs.paymentIntentId &&
      lookups.paymentRequests.get(item.refs.paymentIntentId));

  if (request) {
    next.paymentRequestId = request.id;
    if (request.collection_method === 'tap_to_pay') {
      next.source = 'tap_to_pay';
      next.methodLabel = 'Tap to pay';
    } else if (request.collection_method === 'checkout_link') {
      next.source = 'payment_link';
      next.methodLabel = 'Payment link';
    }
    if (request.note?.trim() && (!next.refs.note || next.title === 'Payment')) {
      next.title = request.note.trim();
    }
  }

  let bookingId = next.bookingId;
  if (!bookingId && item.refs.paymentIntentId) {
    bookingId =
      lookups.tapToPayIntents.get(item.refs.paymentIntentId)?.bookingId ??
      lookups.checkoutSessions.get(item.refs.paymentIntentId)?.bookingId ??
      null;
  }
  if (!bookingId && item.refs.bookingCheckoutSessionRowId) {
    bookingId =
      lookups.checkoutSessions.get(item.refs.bookingCheckoutSessionRowId)
        ?.bookingId ?? null;
  }

  const planName = item.refs.membershipPlanId
    ? lookups.membershipPlans.get(item.refs.membershipPlanId)
    : undefined;
  if (planName) {
    next.source = 'membership';
    next.methodLabel = 'Membership';
    if (
      isUnusablePaymentsTransactionTitle(next.title) ||
      next.title === 'Membership'
    ) {
      next.title = planName;
    }
  }

  if (bookingId) {
    next.bookingId = bookingId;
    if (next.source === 'other') {
      next.source = 'booking';
    }
    if (lookups.tapToPayIntents.get(item.refs.paymentIntentId ?? '')) {
      next.methodLabel = 'Tap to pay';
    }
    const booking = lookups.bookings.get(bookingId);
    if (booking) {
      const resolved = resolvePaymentsTransactionBookingTitle({
        serviceName: booking.service_name,
        jobDetails: booking.job_details,
      });
      if (resolved.title) {
        next.title = resolved.title;
        next.serviceName = resolved.serviceName;
        next.extraCount = resolved.extraCount;
        next.jobCount = resolved.jobCount;
      }
      if (booking.customer_name?.trim()) {
        next.customerName = booking.customer_name.trim();
      }
    }
  }

  if (next.kind === 'payout') {
    next.title = 'Payout';
    next.subtitle = '';
    next.extraCount = 0;
    next.jobCount = 0;
    next.serviceName = null;
  } else {
    if (
      isUnusablePaymentsTransactionTitle(next.title) &&
      next.kind !== 'refund'
    ) {
      next.title = 'Payment';
    } else {
      const fromTitle = resolvePaymentsTransactionBookingTitle({
        serviceName: next.title,
      });
      if (fromTitle.title) {
        next.title = fromTitle.title;
        if (next.extraCount === 0) {
          next.extraCount = fromTitle.extraCount;
          next.jobCount = fromTitle.jobCount;
        }
        if (!next.serviceName) next.serviceName = fromTitle.serviceName;
      }
    }
    next.subtitle = next.customerName
      ? `${next.customerName} · ${next.methodLabel}`
      : next.methodLabel;
  }

  return next;
}

async function loadPaymentRequests(
  supabase: SupabaseClient<Database>,
  businessId: string,
  ids: { paymentRequestIds: string[]; paymentIntentIds: string[] }
): Promise<Map<string, PaymentRequestLookup>> {
  const map = new Map<string, PaymentRequestLookup>();
  const orParts: string[] = [];
  if (ids.paymentRequestIds.length > 0) {
    orParts.push(`id.in.(${ids.paymentRequestIds.join(',')})`);
  }
  if (ids.paymentIntentIds.length > 0) {
    orParts.push(
      `stripe_payment_intent_id.in.(${ids.paymentIntentIds.join(',')})`
    );
  }
  if (orParts.length === 0) return map;

  const { data, error } = await fromTable(supabase, 'payment_requests')
    .select('id, note, collection_method, stripe_payment_intent_id')
    .eq('business_id', businessId)
    .or(orParts.join(','));

  if (error) {
    console.error(
      '[payments:transactions] load payment_requests failed',
      error
    );
    return map;
  }

  for (const row of (data ?? []) as PaymentRequestLookup[]) {
    map.set(row.id, row);
    const pi = row.stripe_payment_intent_id?.trim();
    if (pi) map.set(pi, row);
  }
  return map;
}

async function loadBookingTapToPayIntents(
  supabase: SupabaseClient<Database>,
  businessId: string,
  paymentIntentIds: string[]
): Promise<Map<string, { bookingId: string }>> {
  const map = new Map<string, { bookingId: string }>();
  if (paymentIntentIds.length === 0) return map;

  const { data, error } = await fromTable(
    supabase,
    'booking_tap_to_pay_intents'
  )
    .select('booking_id, stripe_payment_intent_id')
    .eq('business_id', businessId)
    .in('stripe_payment_intent_id', paymentIntentIds);

  if (error) {
    console.error(
      '[payments:transactions] load booking_tap_to_pay_intents failed',
      error
    );
    return map;
  }

  for (const row of data ?? []) {
    const pi = String(
      (row as { stripe_payment_intent_id?: string }).stripe_payment_intent_id ??
        ''
    ).trim();
    const bookingId = String(
      (row as { booking_id?: string }).booking_id ?? ''
    ).trim();
    if (pi && bookingId) map.set(pi, { bookingId });
  }
  return map;
}

async function loadBookingCheckoutSessions(
  supabase: SupabaseClient<Database>,
  businessId: string,
  ids: { checkoutSessionRowIds: string[]; paymentIntentIds: string[] }
): Promise<Map<string, { bookingId: string | null }>> {
  const map = new Map<string, { bookingId: string | null }>();
  const orParts: string[] = [];
  if (ids.checkoutSessionRowIds.length > 0) {
    orParts.push(`id.in.(${ids.checkoutSessionRowIds.join(',')})`);
  }
  if (ids.paymentIntentIds.length > 0) {
    orParts.push(
      `stripe_payment_intent_id.in.(${ids.paymentIntentIds.join(',')})`
    );
  }
  if (orParts.length === 0) return map;

  const { data, error } = await fromTable(supabase, 'booking_checkout_sessions')
    .select('id, booking_id, stripe_payment_intent_id')
    .eq('business_id', businessId)
    .or(orParts.join(','));

  if (error) {
    console.error(
      '[payments:transactions] load booking_checkout_sessions failed',
      error
    );
    return map;
  }

  for (const row of data ?? []) {
    const bookingId =
      String((row as { booking_id?: string | null }).booking_id ?? '').trim() ||
      null;
    const id = String((row as { id?: string }).id ?? '').trim();
    const pi = String(
      (row as { stripe_payment_intent_id?: string | null })
        .stripe_payment_intent_id ?? ''
    ).trim();
    if (id) map.set(id, { bookingId });
    if (pi) map.set(pi, { bookingId });
  }
  return map;
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
    console.error('[payments:transactions] load bookings failed', error);
    return map;
  }

  for (const row of (data ?? []) as BookingLookup[]) {
    map.set(row.id, row);
  }
  return map;
}

function fromTable(supabase: SupabaseClient<Database>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-maintained Database types
  return (supabase as unknown as SupabaseClient<any>).from(table);
}

async function loadMembershipPlans(
  supabase: SupabaseClient<Database>,
  businessId: string,
  planIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (planIds.length === 0) return map;

  const { data, error } = await membershipPlansOf(supabase)
    .select('id, name')
    .eq('business_id', businessId)
    .in('id', planIds);

  if (error) {
    console.error(
      '[payments:transactions] load membership_plans failed',
      error
    );
    return map;
  }

  for (const row of data ?? []) {
    const id = String((row as { id?: string }).id ?? '').trim();
    const name = String((row as { name?: string }).name ?? '').trim();
    if (id && name) map.set(id, name);
  }
  return map;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}
