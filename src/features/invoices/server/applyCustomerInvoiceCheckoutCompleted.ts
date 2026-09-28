import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/** Stripe Checkout `metadata.kind` for a customer invoice. */
export const CUSTOMER_INVOICE_CHECKOUT_KIND = 'customer_invoice';

/** Stripe card minimum for USD. */
export const CUSTOMER_INVOICE_CARD_MIN_CENTS = 50;

export function isCustomerInvoiceCheckoutKind(
  metadata: Stripe.Metadata | null | undefined
): boolean {
  return metadata?.kind === CUSTOMER_INVOICE_CHECKOUT_KIND;
}

export type ApplyCustomerInvoiceCheckoutResult =
  | { handled: true }
  | { handled: false; reason: string };

/**
 * Marks a sent invoice paid after Checkout succeeds.
 * A void invoice stays void. The amount must match the bill.
 */
export async function applyCustomerInvoiceCheckoutCompleted(
  supabase: SupabaseClient,
  args: {
    session: Stripe.Checkout.Session;
    eventId?: string;
  }
): Promise<ApplyCustomerInvoiceCheckoutResult> {
  const { session, eventId } = args;
  if (!isCustomerInvoiceCheckoutKind(session.metadata)) {
    return { handled: false, reason: 'not_customer_invoice' };
  }

  const invoiceId =
    typeof session.metadata?.invoiceId === 'string'
      ? session.metadata.invoiceId.trim()
      : '';
  if (!invoiceId) {
    console.error('[invoice:checkout] missing invoice id', {
      eventId,
      sessionId: session.id,
    });
    return { handled: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: row, error } = await db
    .from('invoices')
    .select('id, status, total_cents')
    .eq('id', invoiceId)
    .maybeSingle();

  if (error || !row) {
    console.error('[invoice:checkout] load invoice failed', {
      eventId,
      sessionId: session.id,
      invoiceId,
      error,
    });
    return { handled: true };
  }

  if (row.status === 'paid') return { handled: true };

  if (row.status !== 'sent') {
    console.error('[invoice:checkout] invoice is not awaiting payment', {
      eventId,
      sessionId: session.id,
      invoiceId,
      status: row.status,
    });
    return { handled: true };
  }

  const amountPaidCents =
    typeof session.amount_total === 'number' ? session.amount_total : 0;
  const expectedCents = Number(row.total_cents) || 0;
  if (amountPaidCents !== expectedCents) {
    console.error('[invoice:checkout] amount mismatch', {
      eventId,
      sessionId: session.id,
      invoiceId,
      expectedCents,
      amountPaidCents,
    });
    return { handled: true };
  }

  const { error: updateError } = await db
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .eq('status', 'sent');

  if (updateError) {
    console.error('[invoice:checkout] mark paid failed', {
      eventId,
      sessionId: session.id,
      invoiceId,
      error: updateError,
    });
  }

  return { handled: true };
}
