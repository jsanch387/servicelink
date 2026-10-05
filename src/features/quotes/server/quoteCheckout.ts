import { insertBookingPaymentsRowForNoCheckoutPublicBooking } from '@/features/availability/services/bookingService';
import type { QuoteRespondStructuredAddress } from '@/features/quotes/public-view/quoteRespondAddress';
import { quoteTableColumnsFromServiceLocation } from '@/features/quotes/public-view/quoteRespondAddress';
import {
  finalizeApprovedQuoteToBooking,
  type BusinessProfileForQuoteApproval,
} from '@/features/quotes/server/quoteApprovalSideEffects';
import { loadQuoteCardReadiness } from '@/features/quotes/server/quotePaymentSnapshot';
import type { QuotePaymentChoice } from '@/features/quotes/shared/quotePaymentCollection';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export type QuoteCheckoutAcceptPayload = {
  linkId: string;
  paymentChoice: Extract<QuotePaymentChoice, 'deposit' | 'full'>;
  address: QuoteRespondStructuredAddress;
  displayLine: string;
  scheduledDate: string;
  scheduledStartTimeForDb: string;
  totalCents: number;
  depositType: 'fixed' | 'percent' | null;
  depositValue: number | null;
  previousStatus: 'sent' | 'viewed';
};

function quoteCheckoutReturnUrl(
  baseUrl: string,
  token: string,
  checkout: 'success' | 'cancel'
): string {
  const url = new URL(`/q/${encodeURIComponent(token)}`, baseUrl);
  url.searchParams.set('checkout', checkout);
  if (checkout === 'cancel') return url.toString();
  return `${url.toString()}&session_id={CHECKOUT_SESSION_ID}`;
}

function parseAcceptPayload(raw: unknown): QuoteCheckoutAcceptPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;
  const address = body.address;
  if (!address || typeof address !== 'object') return null;
  const loc = address as Record<string, unknown>;
  const street = typeof loc.street === 'string' ? loc.street : '';
  const paymentChoice = body.paymentChoice;
  if (paymentChoice !== 'deposit' && paymentChoice !== 'full') return null;
  const scheduledDate =
    typeof body.scheduledDate === 'string' ? body.scheduledDate : '';
  const scheduledStartTimeForDb =
    typeof body.scheduledStartTimeForDb === 'string'
      ? body.scheduledStartTimeForDb
      : '';
  if (!scheduledDate || !scheduledStartTimeForDb || !street) return null;
  const previousStatus = body.previousStatus === 'sent' ? 'sent' : 'viewed';
  const depositType =
    body.depositType === 'fixed' || body.depositType === 'percent'
      ? body.depositType
      : null;
  return {
    linkId: typeof body.linkId === 'string' ? body.linkId : '',
    paymentChoice,
    address: {
      street,
      unit: typeof loc.unit === 'string' ? loc.unit : null,
      city: typeof loc.city === 'string' ? loc.city : '',
      state: typeof loc.state === 'string' ? loc.state : '',
      zip: typeof loc.zip === 'string' ? loc.zip : '',
    },
    displayLine:
      typeof body.displayLine === 'string' ? body.displayLine : street,
    scheduledDate,
    scheduledStartTimeForDb,
    totalCents: Math.max(0, Math.round(Number(body.totalCents ?? 0))),
    depositType,
    depositValue:
      body.depositValue == null ? null : Math.round(Number(body.depositValue)),
    previousStatus,
  };
}

export async function startQuoteCheckout(
  supabase: SupabaseClient<Database>,
  request: Request,
  args: {
    token: string;
    quoteId: string;
    businessId: string;
    serviceName: string;
    amountCents: number;
    payload: QuoteCheckoutAcceptPayload;
  }
): Promise<
  { ok: true; url: string } | { ok: false; error: string; status: number }
> {
  const ready = await loadQuoteCardReadiness(supabase, args.businessId);
  if (!ready.open || !ready.stripeAccountId) {
    return {
      ok: false,
      status: 400,
      error: 'This business cannot accept card payments right now.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: row, error: insertError } = await db
    .from('quote_checkout_sessions')
    .insert({
      quote_id: args.quoteId,
      business_id: args.businessId,
      status: 'created',
      payment_kind: args.payload.paymentChoice,
      currency: ready.currency,
      expected_amount_cents: args.amountCents,
      accept_payload: args.payload,
    })
    .select('id')
    .single();

  if (insertError || !row?.id) {
    console.error('[quote-checkout] insert failed', insertError);
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }

  const sessionRowId = String(row.id);
  const baseUrl = getAppBaseUrl(request);
  const lineName =
    args.serviceName.replace(/\s+/g, ' ').trim().slice(0, 120) || 'Quote';
  const stripe = getStripePlatform();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: ready.currency,
              unit_amount: args.amountCents,
              product_data: {
                name: lineName,
                description:
                  args.payload.paymentChoice === 'deposit'
                    ? `Deposit for ${lineName}`
                    : `Payment for ${lineName}`,
              },
            },
          },
        ],
        success_url: quoteCheckoutReturnUrl(baseUrl, args.token, 'success'),
        cancel_url: quoteCheckoutReturnUrl(baseUrl, args.token, 'cancel'),
        metadata: {
          kind: 'quote_checkout',
          quoteCheckoutSessionId: sessionRowId,
          quoteId: args.quoteId,
          businessId: args.businessId,
        },
      },
      { stripeAccount: ready.stripeAccountId }
    );
  } catch (error) {
    console.error('[quote-checkout] stripe session failed', error);
    await db
      .from('quote_checkout_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', sessionRowId);
    return {
      ok: false,
      status: 502,
      error: userFacingStripeConnectCheckoutError(error),
    };
  }

  await db
    .from('quote_checkout_sessions')
    .update({
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionRowId);

  if (!session.url) {
    return {
      ok: false,
      status: 502,
      error: 'Stripe did not return a checkout URL.',
    };
  }
  return { ok: true, url: session.url };
}

export async function insertQuotePayInPersonPayment(
  supabase: SupabaseClient<Database>,
  args: { bookingId: string; businessId: string; totalCents: number }
): Promise<void> {
  const ready = await loadQuoteCardReadiness(supabase, args.businessId);
  await insertBookingPaymentsRowForNoCheckoutPublicBooking(supabase, {
    bookingId: args.bookingId,
    businessId: args.businessId,
    totalAmountCents: args.totalCents,
    currency: ready.currency,
    paymentsEnabled: true,
    checkoutMode: 'in_person',
  });
}

type QuoteCardPaymentWrite = {
  bookingId: string;
  businessId: string;
  amountPaid: number;
  totalCents: number;
  paymentChoice: Extract<QuotePaymentChoice, 'deposit' | 'full'>;
  depositType: 'fixed' | 'percent' | null;
  depositValue: number | null;
  currency: string;
  sessionId: string;
  paidAt: string;
};

/**
 * Writes the card amount onto the appointment. Throws when the row is not
 * saved so the webhook can retry. A unique conflict means the row is already
 * there; if that row does not show this charge, it is corrected.
 */
async function recordQuoteCardPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  args: QuoteCardPaymentWrite
): Promise<void> {
  const remaining = Math.max(args.totalCents - args.amountPaid, 0);
  const paymentStatus = remaining > 0 ? 'deposit_paid' : 'paid_full';
  const row = {
    provider: 'stripe',
    payment_status: paymentStatus,
    payment_method_selected: 'pay_now',
    currency: args.currency,
    total_amount_cents: args.totalCents,
    required_online_amount_cents: args.amountPaid,
    paid_online_amount_cents: args.amountPaid,
    remaining_amount_cents: remaining,
    deposit_type: args.paymentChoice === 'deposit' ? args.depositType : null,
    deposit_value: args.paymentChoice === 'deposit' ? args.depositValue : null,
    last_checkout_session_id: args.sessionId,
    paid_at: args.paidAt,
  };

  const { error: paymentError } = await db.from('booking_payments').insert({
    booking_id: args.bookingId,
    business_id: args.businessId,
    ...row,
  });
  if (!paymentError) return;

  if (paymentError.code !== '23505') {
    console.error('[quote-checkout] booking_payments insert', paymentError);
    throw new Error('Could not save the quote payment on the appointment');
  }

  const { data: existing, error: readError } = await db
    .from('booking_payments')
    .select('paid_online_amount_cents')
    .eq('booking_id', args.bookingId)
    .maybeSingle();
  if (readError) {
    console.error('[quote-checkout] booking_payments read', readError);
    throw new Error('Could not save the quote payment on the appointment');
  }
  if (Number(existing?.paid_online_amount_cents ?? 0) === args.amountPaid) {
    return;
  }

  const { error: updateError } = await db
    .from('booking_payments')
    .update(row)
    .eq('booking_id', args.bookingId);
  if (updateError) {
    console.error('[quote-checkout] booking_payments update', updateError);
    throw new Error('Could not save the quote payment on the appointment');
  }
}

/**
 * Creates the booking after Stripe Checkout succeeds. Caller owns webhook
 * idempotency. Throws when the booking or its payment row was not saved so
 * the caller can allow Stripe to retry.
 */
export async function applyQuoteCheckoutCompleted(
  supabase: SupabaseClient<Database>,
  session: Stripe.Checkout.Session
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const sessionRowId =
    typeof session.metadata?.quoteCheckoutSessionId === 'string'
      ? session.metadata.quoteCheckoutSessionId.trim()
      : '';

  let checkoutRow: Record<string, unknown> | null = null;
  if (sessionRowId) {
    const { data } = await db
      .from('quote_checkout_sessions')
      .select('*')
      .eq('id', sessionRowId)
      .maybeSingle();
    checkoutRow = (data as Record<string, unknown> | null) ?? null;
  }
  if (!checkoutRow) {
    const { data } = await db
      .from('quote_checkout_sessions')
      .select('*')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();
    checkoutRow = (data as Record<string, unknown> | null) ?? null;
  }
  if (!checkoutRow) {
    console.error('[quote-checkout] missing session row', session.id);
    return;
  }

  const payload = parseAcceptPayload(checkoutRow.accept_payload);
  if (!payload || !payload.linkId) {
    await db
      .from('quote_checkout_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', checkoutRow.id);
    return;
  }

  const amountPaid =
    typeof session.amount_total === 'number' ? session.amount_total : 0;
  const currency =
    typeof session.currency === 'string' && session.currency.trim()
      ? session.currency.trim().toLowerCase()
      : 'usd';
  const paidAt = new Date().toISOString();

  if (checkoutRow.status === 'completed' && checkoutRow.booking_id) {
    await recordQuoteCardPayment(db, {
      bookingId: String(checkoutRow.booking_id),
      businessId: String(checkoutRow.business_id ?? ''),
      amountPaid,
      totalCents: payload.totalCents,
      paymentChoice: payload.paymentChoice,
      depositType: payload.depositType,
      depositValue: payload.depositValue,
      currency,
      sessionId: session.id,
      paidAt,
    });
    return;
  }

  const expected = Number(checkoutRow.expected_amount_cents ?? 0);
  if (amountPaid !== expected) {
    console.error('[quote-checkout] amount mismatch', {
      sessionId: session.id,
      amountPaid,
      expected,
    });
    await db
      .from('quote_checkout_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', checkoutRow.id);
    return;
  }

  const quoteId = String(checkoutRow.quote_id);
  const { data: quoteRow } = await db
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();
  const quote = quoteRow as Record<string, unknown> | null;
  if (!quote) return;

  const nowIso = new Date().toISOString();
  const status = String(quote.status ?? '');
  let working = quote;
  if (status === 'sent' || status === 'viewed') {
    const { data: approved, error: approveError } = await db
      .from('quotes')
      .update({
        status: 'approved',
        approved_at: nowIso,
        scheduled_date: payload.scheduledDate,
        scheduled_start_time: payload.scheduledStartTimeForDb,
        ...quoteTableColumnsFromServiceLocation(payload.address),
      })
      .eq('id', quoteId)
      .in('status', ['sent', 'viewed'])
      .select('*')
      .maybeSingle();
    if (approveError) {
      throw new Error('Could not approve the paid quote');
    }
    if (approved) {
      working = approved as Record<string, unknown>;
    } else {
      const { data: again } = await db
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .maybeSingle();
      if (again) working = again as Record<string, unknown>;
    }
  }
  if (String(working.status ?? '') !== 'approved') {
    throw new Error('Paid quote is not approved');
  }

  const { data: profileRaw } = await db
    .from('business_profiles')
    .select('id, profile_id, business_slug, business_name, free_bookings_count')
    .eq('id', working.business_id)
    .maybeSingle();
  if (!profileRaw) {
    throw new Error('Business missing for paid quote');
  }

  const done = await finalizeApprovedQuoteToBooking(supabase, {
    quoteRow: working,
    respondAddressFallback: payload.address,
    linkId: payload.linkId,
    nowIso,
    businessProfile: profileRaw as BusinessProfileForQuoteApproval,
  });
  if (!done.ok) {
    throw new Error(done.message);
  }

  await recordQuoteCardPayment(db, {
    bookingId: done.bookingId,
    businessId: String(working.business_id),
    amountPaid,
    totalCents: payload.totalCents,
    paymentChoice: payload.paymentChoice,
    depositType: payload.depositType,
    depositValue: payload.depositValue,
    currency,
    sessionId: session.id,
    paidAt,
  });

  const { error: sessionError } = await db
    .from('quote_checkout_sessions')
    .update({
      status: 'completed',
      booking_id: done.bookingId,
      actual_amount_cents: amountPaid,
      stripe_checkout_session_id: session.id,
      completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', checkoutRow.id);
  if (sessionError) {
    console.error('[quote-checkout] session complete update', sessionError);
    throw new Error('Could not finish the quote checkout');
  }
}
