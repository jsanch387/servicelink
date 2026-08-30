import type { PaymentsTransactionSource } from '../transactions/constants';

export const PAYMENTS_SOURCE_COLORS: Record<PaymentsTransactionSource, string> =
  {
    cash: '#34d399',
    payment_app: '#60a5fa',
    tap_to_pay: '#a78bfa',
    booking: '#fbbf24',
    payment_link: '#f472b6',
    membership: '#22d3ee',
    other: '#a1a1aa',
    payout: '#71717a',
  };

export function paymentsSourceColor(source: string | null | undefined): string {
  if (source && source in PAYMENTS_SOURCE_COLORS) {
    return PAYMENTS_SOURCE_COLORS[source as PaymentsTransactionSource];
  }
  return PAYMENTS_SOURCE_COLORS.other;
}
