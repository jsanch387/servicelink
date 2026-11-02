import {
  PAYMENTS_TRANSACTION_KINDS,
  PAYMENTS_TRANSACTIONS_DEFAULT_LIMIT,
  PAYMENTS_TRANSACTIONS_MAX_LIMIT,
  type PaymentsTransactionKind,
} from './constants';
import { isPaymentsTransactionsCursor } from './parseTransactionsCursor';

export interface ListPaymentsTransactionsQuery {
  limit: number;
  startingAfter?: string;
  kind?: PaymentsTransactionKind;
}

export type ParseListPaymentsTransactionsQueryResult =
  | { ok: true; query: ListPaymentsTransactionsQuery }
  | { ok: false; error: string };

export function parseListPaymentsTransactionsQuery(
  searchParams: URLSearchParams
): ParseListPaymentsTransactionsQueryResult {
  const limitRaw = searchParams.get('limit');
  let limit = PAYMENTS_TRANSACTIONS_DEFAULT_LIMIT;
  if (limitRaw != null && limitRaw.trim() !== '') {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: 'limit must be a positive whole number.' };
    }
    limit = Math.min(parsed, PAYMENTS_TRANSACTIONS_MAX_LIMIT);
  }

  const startingAfterRaw = searchParams.get('startingAfter')?.trim();
  if (startingAfterRaw && !isPaymentsTransactionsCursor(startingAfterRaw)) {
    return {
      ok: false,
      error: 'startingAfter must be the nextCursor from the previous page.',
    };
  }

  const kindRaw = searchParams.get('kind')?.trim();
  let kind: PaymentsTransactionKind | undefined;
  if (kindRaw) {
    if (
      !PAYMENTS_TRANSACTION_KINDS.includes(kindRaw as PaymentsTransactionKind)
    ) {
      return {
        ok: false,
        error: 'kind must be payment, refund, or payout.',
      };
    }
    kind = kindRaw as PaymentsTransactionKind;
  }

  return {
    ok: true,
    query: {
      limit,
      startingAfter: startingAfterRaw || undefined,
      kind,
    },
  };
}
