import type Stripe from 'stripe';

const CARD_DECLINED_MESSAGE =
  'The card on file was declined. Try again when it has funds, or manage billing to use a different card.';

export type ChargeOpenSubscriptionResult =
  | { ok: true }
  | { ok: false; error: string; status: number; url?: string };

function chargeableInvoice(
  invoice: Stripe.Invoice | null | undefined
): { id: string; hostedInvoiceUrl: string | null } | null {
  if (!invoice?.id) return null;
  if (invoice.status !== 'open' || (invoice.amount_due ?? 0) <= 0) return null;
  const hostedInvoiceUrl = invoice.hosted_invoice_url?.trim() || null;
  return { id: invoice.id, hostedInvoiceUrl };
}

function stripeErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object' || !('code' in err)) return '';
  return typeof err.code === 'string' ? err.code : '';
}

function needsBankConfirmation(err: unknown): boolean {
  const code = stripeErrorCode(err);
  return (
    code === 'authentication_required' ||
    code === 'invoice_payment_intent_requires_action'
  );
}

function alreadyPaid(err: unknown): boolean {
  const message = err instanceof Error ? err.message : '';
  return /already paid/i.test(message);
}

/**
 * Charges the card already on file for this subscription's open bill.
 * Does not start a new subscription and does not change the card.
 */
export async function chargeOpenPlatformSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<ChargeOpenSubscriptionResult> {
  const subId = subscriptionId.trim();
  if (!subId) {
    return { ok: false, status: 400, error: 'No subscription to reactivate' };
  }

  const sub = await stripe.subscriptions.retrieve(subId, {
    expand: ['latest_invoice'],
  });
  const latest =
    sub.latest_invoice && typeof sub.latest_invoice === 'object'
      ? sub.latest_invoice
      : null;
  let invoice = chargeableInvoice(latest);

  if (!invoice) {
    const listed = await stripe.invoices.list({
      subscription: subId,
      status: 'open',
      limit: 10,
    });
    for (const candidate of listed.data) {
      invoice = chargeableInvoice(candidate);
      if (invoice) break;
    }
  }

  if (!invoice) {
    return {
      ok: false,
      status: 409,
      error: 'There is no open bill to charge.',
    };
  }

  try {
    const paid = await stripe.invoices.pay(invoice.id);
    if (paid.status !== 'paid') {
      return { ok: false, status: 402, error: CARD_DECLINED_MESSAGE };
    }
    return { ok: true };
  } catch (err) {
    if (alreadyPaid(err)) return { ok: true };
    if (needsBankConfirmation(err) && invoice.hostedInvoiceUrl) {
      return {
        ok: false,
        status: 402,
        error: 'Your bank needs to confirm this payment.',
        url: invoice.hostedInvoiceUrl,
      };
    }
    return { ok: false, status: 402, error: CARD_DECLINED_MESSAGE };
  }
}
