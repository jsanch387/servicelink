import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import type { PaymentsTransactionTone } from './constants';
import type { MappedPaymentsTransaction } from './mapStripeBalanceTransaction';

export function applyPaymentsTransactionDisplay(
  item: MappedPaymentsTransaction
): MappedPaymentsTransaction {
  const tone: PaymentsTransactionTone =
    item.kind === 'payout' ? 'payout' : item.kind === 'refund' ? 'out' : 'in';

  return {
    ...item,
    tone,
    amountLabel: amountLabelFor(item, tone),
    statusLabel: statusLabelFor(item),
    dateLabel: formatShortDate(item.createdAt),
    feeLabel:
      item.feeCents > 0
        ? `Stripe fee ${formatPaymentCents(item.feeCents)}`
        : null,
  };
}

function amountLabelFor(
  item: MappedPaymentsTransaction,
  tone: PaymentsTransactionTone
): string {
  const formatted = formatPaymentCents(Math.abs(item.displayAmountCents));
  if (tone === 'in') return `+${formatted}`;
  if (tone === 'out') return `−${formatted}`;
  return formatted;
}

function statusLabelFor(item: MappedPaymentsTransaction): string {
  if (item.kind === 'payout') {
    if (item.status === 'in_transit') return 'On the way';
    if (item.status === 'paid') return 'Arrived';
    if (item.status === 'failed') return 'Failed';
    if (item.status === 'canceled') return 'Canceled';
    return 'Pending';
  }
  if (item.kind === 'refund') return 'Refunded';
  if (item.status === 'pending') return 'Pending';
  return 'Paid';
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
