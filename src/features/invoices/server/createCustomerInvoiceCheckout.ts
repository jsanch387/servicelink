import { getPublicBillPath } from '@/constants/routes';
import { isValidInvoiceShortCode } from '@/features/availability/booking/server/generateInvoiceShortCode';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import type { Database } from '@/libs/supabase/client';
import { userFacingStripeConnectCheckoutError } from '@/libs/stripe/userFacingStripeConnectCheckoutError';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  applyCustomerInvoiceCheckoutCompleted,
  CUSTOMER_INVOICE_CARD_MIN_CENTS,
  CUSTOMER_INVOICE_CHECKOUT_KIND,
} from './applyCustomerInvoiceCheckoutCompleted';

export type CreateCustomerInvoiceCheckoutResult =
  | { ok: true; url: string }
  | { ok: true; alreadyPaid: true }
  | { ok: false; httpStatus: number; error: string };

type PayableInvoice = {
  id: string;
  businessId: string;
  status: string;
  invoiceNumber: number;
  totalCents: number;
  customerEmail: string | null;
  businessName: string;
  shortCode: string;
};

export async function createCustomerInvoiceCheckout(
  admin: SupabaseClient,
  request: Request,
  shortCode: string
): Promise<CreateCustomerInvoiceCheckoutResult> {
  const invoice = await loadPayableInvoice(admin, shortCode);
  if (!invoice) {
    return { ok: false, httpStatus: 404, error: 'Invoice not found.' };
  }
  if (invoice.status === 'paid') return { ok: true, alreadyPaid: true };
  if (invoice.status !== 'sent') {
    return {
      ok: false,
      httpStatus: 409,
      error: 'This invoice cannot be paid.',
    };
  }
  if (invoice.totalCents < CUSTOMER_INVOICE_CARD_MIN_CENTS) {
    return {
      ok: false,
      httpStatus: 422,
      error: 'This amount is too small to pay by card.',
    };
  }

  const account = await loadChargesEnabledAccount(admin, invoice.businessId);
  if (!account) {
    return {
      ok: false,
      httpStatus: 422,
      error: 'Card payment is not available for this invoice.',
    };
  }

  const baseUrl = getAppBaseUrl(request);
  const billUrl = `${baseUrl}${getPublicBillPath(invoice.shortCode)}`;
  const stripe = getStripePlatform();

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: invoice.customerEmail ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: invoice.totalCents,
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: `Payment to ${invoice.businessName}`,
              },
            },
          },
        ],
        success_url: `${billUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: billUrl,
        payment_intent_data: {
          description: `Invoice ${invoice.invoiceNumber}`,
          metadata: {
            kind: CUSTOMER_INVOICE_CHECKOUT_KIND,
            invoiceId: invoice.id,
            businessId: invoice.businessId,
          },
        },
        metadata: {
          kind: CUSTOMER_INVOICE_CHECKOUT_KIND,
          invoiceId: invoice.id,
          businessId: invoice.businessId,
        },
      },
      { stripeAccount: account.stripeAccountId }
    );

    if (!session.url) {
      return {
        ok: false,
        httpStatus: 502,
        error: 'Stripe did not return a checkout URL.',
      };
    }

    return { ok: true, url: session.url };
  } catch (error) {
    console.error('[invoice:checkout] checkout.sessions.create failed', error);
    return {
      ok: false,
      httpStatus: 500,
      error: userFacingStripeConnectCheckoutError(error),
    };
  }
}

/**
 * When the customer returns from Checkout, mark the invoice paid if Stripe
 * already collected the money. The webhook does the same update.
 */
export async function confirmCustomerInvoiceCheckoutReturn(
  admin: SupabaseClient,
  shortCode: string,
  sessionId: string
): Promise<void> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 255) return;

  const invoice = await loadPayableInvoice(admin, shortCode);
  if (!invoice || invoice.status === 'paid' || invoice.status !== 'sent') {
    return;
  }

  const account = await loadChargesEnabledAccount(admin, invoice.businessId);
  if (!account) return;

  try {
    const session = await getStripePlatform().checkout.sessions.retrieve(
      sessionId,
      { stripeAccount: account.stripeAccountId }
    );
    if (session.metadata?.invoiceId !== invoice.id) return;
    if (session.payment_status !== 'paid') return;
    await applyCustomerInvoiceCheckoutCompleted(admin, {
      session,
      eventId: 'checkout_return',
    });
  } catch (error) {
    console.error('[invoice:checkout] confirm return failed', error);
  }
}

async function loadPayableInvoice(
  admin: SupabaseClient,
  shortCode: string
): Promise<PayableInvoice | null> {
  const code = shortCode.trim();
  if (!isValidInvoiceShortCode(code)) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('invoices')
    .select(
      'id, business_id, status, invoice_number, total_cents, customer_email, short_code'
    )
    .eq('short_code', code)
    .maybeSingle();

  if (error || !data || typeof data.invoice_number !== 'number') return null;

  const { data: business } = await admin
    .from('business_profiles')
    .select('business_name')
    .eq('id', data.business_id)
    .maybeSingle();

  const email =
    typeof data.customer_email === 'string' ? data.customer_email.trim() : '';

  return {
    id: String(data.id),
    businessId: String(data.business_id),
    status: String(data.status),
    invoiceNumber: data.invoice_number,
    totalCents: Number(data.total_cents) || 0,
    customerEmail: email.includes('@') ? email : null,
    businessName: business?.business_name?.trim() || 'your business',
    shortCode: code,
  };
}

async function loadChargesEnabledAccount(
  admin: SupabaseClient,
  businessId: string
): Promise<{ stripeAccountId: string } | null> {
  const { data, error } = await paymentAccountsOf(
    admin as SupabaseClient<Database>
  )
    .select('stripe_account_id, charges_enabled, onboarding_status')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !data) return null;

  const stripeAccountId =
    typeof data.stripe_account_id === 'string'
      ? data.stripe_account_id.trim()
      : '';
  if (
    !stripeAccountId ||
    data.charges_enabled !== true ||
    data.onboarding_status !== 'complete'
  ) {
    return null;
  }

  return { stripeAccountId };
}
