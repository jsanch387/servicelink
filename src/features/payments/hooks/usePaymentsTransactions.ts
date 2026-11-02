'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaymentsTransactionKind } from '../transactions/constants';
import type {
  PaymentsTransactionBalance,
  PaymentsTransactionListItem,
} from '../transactions/publicTransaction';

export type PaymentsTransactionsKindFilter = 'all' | PaymentsTransactionKind;

const PAGE_SIZE = 10;

export function usePaymentsTransactions(kind: PaymentsTransactionsKindFilter) {
  const [items, setItems] = useState<PaymentsTransactionListItem[]>([]);
  const [balance, setBalance] = useState<PaymentsTransactionBalance | null>(
    null
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorsRef = useRef<(string | null)[]>([null]);
  const requestRef = useRef(0);

  const load = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (kind !== 'all') params.set('kind', kind);
      if (cursor) params.set('startingAfter', cursor);

      const response = await fetch(
        `${API_ROUTES.PAYMENTS_TRANSACTIONS}?${params.toString()}`
      );
      const body = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        balance?: PaymentsTransactionBalance;
        items?: PaymentsTransactionListItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      };

      if (!response.ok || body.success === false) {
        throw new Error(
          typeof body.error === 'string' && body.error.trim()
            ? body.error
            : "Couldn't load transactions. Try again."
        );
      }

      return {
        balance: body.balance ?? null,
        items: Array.isArray(body.items) ? body.items : [],
        hasMore: Boolean(body.hasMore),
        nextCursor: body.nextCursor ?? null,
      };
    },
    [kind]
  );

  const showPage = useCallback(
    async (index: number) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError(null);
      try {
        const page = await load(cursorsRef.current[index] ?? null);
        if (requestId !== requestRef.current) return;
        setBalance(page.balance);
        setItems(page.items);
        setPageIndex(index);
        const nextCursor =
          page.hasMore && page.nextCursor ? page.nextCursor : null;
        setHasNext(Boolean(nextCursor));
        if (nextCursor) cursorsRef.current[index + 1] = nextCursor;
      } catch (err: unknown) {
        if (requestId !== requestRef.current) return;
        setError(
          err instanceof Error ? err.message : "Couldn't load transactions."
        );
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [load]
  );

  useEffect(() => {
    cursorsRef.current = [null];
    setPageIndex(0);
    setHasNext(false);
    setItems([]);
    void showPage(0);
    return () => {
      requestRef.current += 1;
    };
  }, [showPage]);

  const goToPrevious = useCallback(() => {
    if (pageIndex < 1) return;
    void showPage(pageIndex - 1);
  }, [pageIndex, showPage]);

  const goToNext = useCallback(() => {
    if (!hasNext) return;
    void showPage(pageIndex + 1);
  }, [hasNext, pageIndex, showPage]);

  return {
    items,
    balance,
    loading,
    error,
    page: pageIndex + 1,
    hasPrevious: pageIndex > 0,
    hasNext,
    goToPrevious,
    goToNext,
    reload: () => {
      cursorsRef.current = [null];
      void showPage(0);
    },
  };
}
