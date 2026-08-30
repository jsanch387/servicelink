'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useState } from 'react';
import type { PaymentsTransactionKind } from '../transactions/constants';
import type {
  PaymentsTransactionBalance,
  PaymentsTransactionListItem,
} from '../transactions/publicTransaction';

export type PaymentsTransactionsKindFilter = 'all' | PaymentsTransactionKind;

export function usePaymentsTransactions(kind: PaymentsTransactionsKindFilter) {
  const [items, setItems] = useState<PaymentsTransactionListItem[]>([]);
  const [balance, setBalance] = useState<PaymentsTransactionBalance | null>(
    null
  );
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams({ limit: '20' });
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

  useEffect(() => {
    const controller = { cancelled: false };
    setLoading(true);
    setError(null);
    setItems([]);
    setNextCursor(null);
    setHasMore(false);

    void load(null)
      .then(page => {
        if (controller.cancelled) return;
        setBalance(page.balance);
        setItems(page.items);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch((err: unknown) => {
        if (controller.cancelled) return;
        setError(
          err instanceof Error ? err.message : "Couldn't load transactions."
        );
      })
      .finally(() => {
        if (!controller.cancelled) setLoading(false);
      });

    return () => {
      controller.cancelled = true;
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await load(nextCursor);
      setItems(current => [...current, ...page.items]);
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Couldn't load transactions."
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, load, loadingMore, nextCursor]);

  return {
    items,
    balance,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    reload: () => {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setLoading(true);
      setError(null);
      void load(null)
        .then(page => {
          setBalance(page.balance);
          setItems(page.items);
          setHasMore(page.hasMore);
          setNextCursor(page.nextCursor);
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Couldn't load transactions."
          );
        })
        .finally(() => setLoading(false));
    },
  };
}
