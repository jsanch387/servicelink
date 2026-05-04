import type { AvailabilityBookingPaymentSummary } from '@/features/email';

/** Same shape as POST /api/public/bookings (non–Stripe checkout). */
export function buildPaymentSummaryForAvailabilityBookingEmail(params: {
  paymentsEnabled: boolean;
  checkoutMode: string | null | undefined;
  currency: string;
  totalPriceCents: number;
  hasPriceLineItems: boolean;
}): AvailabilityBookingPaymentSummary {
  const code = /^[a-z]{3}$/.test(params.currency.trim().toLowerCase())
    ? params.currency.trim().toLowerCase()
    : 'usd';
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase(),
    }).format(cents / 100);

  const rows: Array<{ label: string; value: string }> = [];

  if (!params.paymentsEnabled) {
    rows.push({
      label: 'Online payment',
      value: 'Not required for this booking',
    });
  } else if (params.checkoutMode === 'in_person') {
    rows.push({
      label: 'How you pay',
      value: 'Pay your provider when you meet',
    });
    rows.push({
      label: 'ServiceLink card charge',
      value: 'None',
    });
  } else {
    rows.push({
      label: 'ServiceLink card charge',
      value: 'None for this booking',
    });
  }

  if (params.totalPriceCents > 0 && !params.hasPriceLineItems) {
    rows.push({
      label: 'Appointment total',
      value: fmt(params.totalPriceCents),
    });
  }

  return {
    title: 'Payment',
    rows,
  };
}
