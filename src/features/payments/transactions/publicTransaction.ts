import type {
  PaymentsTransactionKind,
  PaymentsTransactionSource,
  PaymentsTransactionTone,
} from './constants';

/** Fields the web list paints from GET /api/payments/transactions. */
export interface PaymentsTransactionListItem {
  id: string;
  kind: PaymentsTransactionKind;
  source?: PaymentsTransactionSource;
  title: string;
  extraCount: number;
  subtitle: string | null;
  methodLabel: string;
  statusLabel: string;
  amountLabel: string;
  tone: PaymentsTransactionTone;
  dateLabel: string;
  feeLabel: string | null;
  bookingId: string | null;
}

export interface PaymentsTransactionBalance {
  availableLabel: string;
  pendingLabel: string;
  availableCaption: string;
  pendingCaption: string;
}

export interface PaymentsTransactionsListResponse {
  success: true;
  currency: string;
  balance: PaymentsTransactionBalance;
  items: PaymentsTransactionListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaymentsTransactionDateGroup {
  dateLabel: string;
  items: PaymentsTransactionListItem[];
}

export function groupTransactionsByDate(
  items: PaymentsTransactionListItem[]
): PaymentsTransactionDateGroup[] {
  const groups: PaymentsTransactionDateGroup[] = [];
  for (const item of items) {
    const label = item.dateLabel.trim() || 'Earlier';
    const last = groups[groups.length - 1];
    if (last && last.dateLabel === label) {
      last.items.push(item);
    } else {
      groups.push({ dateLabel: label, items: [item] });
    }
  }
  return groups;
}
