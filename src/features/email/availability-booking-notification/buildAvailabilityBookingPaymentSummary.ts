import type { AvailabilityBookingPaymentSummary } from './types';

function formatMoney(cents: number, currency: string): string {
  const code = /^[a-z]{3}$/.test(currency.trim().toLowerCase())
    ? currency.trim().toLowerCase()
    : 'usd';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code.toUpperCase(),
  }).format(Math.max(0, cents) / 100);
}

function isPayInPersonBooking(params: {
  checkoutMode: string | null | undefined;
  clientPaymentMethod?: 'pay_in_person' | 'pay_now' | 'none' | null;
}): boolean {
  const mode = String(params.checkoutMode ?? '').trim();
  return (
    mode === 'in_person' ||
    (mode === 'customer_choice' &&
      params.clientPaymentMethod === 'pay_in_person')
  );
}

/** Payment card for POST /api/public/bookings (no Stripe checkout on this path). */
export function buildPublicBookingNoCheckoutPaymentSummary(params: {
  paymentsEnabled: boolean;
  checkoutMode: string | null | undefined;
  clientPaymentMethod?: 'pay_in_person' | 'pay_now' | 'none' | null;
  currency: string;
  totalPriceCents: number;
  hasPriceLineItems: boolean;
}): AvailabilityBookingPaymentSummary | undefined {
  const total = Math.max(0, Math.round(params.totalPriceCents));
  const fmt = (cents: number) => formatMoney(cents, params.currency);

  if (!params.paymentsEnabled) {
    return undefined;
  }

  if (isPayInPersonBooking(params)) {
    const rows: Array<{ label: string; value: string }> = [
      { label: 'Payment method', value: 'Pay in person' },
    ];
    if (total > 0 && !params.hasPriceLineItems) {
      rows.push({ label: 'Amount due at appointment', value: fmt(total) });
    }
    return { title: 'Payment', rows };
  }

  return undefined;
}

/** Payment card after Stripe booking checkout completes. */
export function buildStripeCheckoutPaymentSummary(params: {
  paymentStatus: 'paid_full' | 'deposit_paid';
  amountPaidCents: number;
  remainingCents: number;
  totalPriceCents: number;
  currency: string;
  hasPriceLineItems: boolean;
}): AvailabilityBookingPaymentSummary {
  const fmt = (cents: number) => formatMoney(cents, params.currency);

  if (params.paymentStatus === 'paid_full') {
    return {
      title: 'Payment',
      rows: [{ label: 'Paid in full', value: fmt(params.amountPaidCents) }],
      stripeCardPayment: true,
    };
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Deposit paid', value: fmt(params.amountPaidCents) },
    { label: 'Remaining balance', value: fmt(params.remainingCents) },
  ];
  if (!params.hasPriceLineItems) {
    rows.push({
      label: 'Appointment total',
      value: fmt(params.totalPriceCents),
    });
  }

  return {
    title: 'Payment',
    rows,
    stripeCardPayment: true,
  };
}
