'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QuotesListResponse } from '../api/types';
import type { DashboardQuote } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

interface UseDashboardQuotesResult {
  quotes: DashboardQuote[];
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadQuotes: () => Promise<void>;
}

export function useDashboardQuotes(): UseDashboardQuotesResult {
  const [quotes, setQuotes] = useState<DashboardQuote[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadQuotes = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);
    try {
      const response = await fetch('/api/quotes', { method: 'GET' });
      const json = (await response
        .json()
        .catch(() => null)) as QuotesListResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load quotes');
      }

      setQuotes(Array.isArray(json.quotes) ? json.quotes : []);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load quotes';
      setLoadError(message);
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void reloadQuotes();
  }, [reloadQuotes]);

  return { quotes, loadStatus, loadError, reloadQuotes };
}
