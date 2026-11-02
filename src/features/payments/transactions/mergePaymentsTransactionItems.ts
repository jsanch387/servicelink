import { buildPaymentsTransactionsCursor } from './parseTransactionsCursor';
import type { MappedPaymentsTransaction } from './mapStripeBalanceTransaction';

export function mergePaymentsTransactionPage(args: {
  stripeItems: MappedPaymentsTransaction[];
  localItems: MappedPaymentsTransaction[];
  limit: number;
  stripeHasMore: boolean;
  localHasMore: boolean;
  previousStripeAfter?: string;
}): {
  items: MappedPaymentsTransaction[];
  hasMore: boolean;
  nextCursor: string | null;
} {
  const merged = [...args.stripeItems, ...args.localItems].sort(
    compareTransactionsDesc
  );
  const items = merged.slice(0, args.limit);
  const leftover = merged.length > args.limit;
  const hasMore = leftover || args.stripeHasMore || args.localHasMore;
  const last = items[items.length - 1];

  if (!hasMore || !last) {
    return { items, hasMore: false, nextCursor: null };
  }

  const lastStripeId =
    [...items].reverse().find(item => item.id.startsWith('txn_'))?.id ??
    args.previousStripeAfter ??
    null;

  return {
    items,
    hasMore: true,
    nextCursor: buildPaymentsTransactionsCursor({
      beforeIso: last.createdAt,
      stripeAfter: lastStripeId,
    }),
  };
}

export function compareTransactionsDesc(
  a: MappedPaymentsTransaction,
  b: MappedPaymentsTransaction
): number {
  const aTime = Date.parse(a.createdAt);
  const bTime = Date.parse(b.createdAt);
  if (aTime !== bTime) return bTime - aTime;
  return b.id.localeCompare(a.id);
}
