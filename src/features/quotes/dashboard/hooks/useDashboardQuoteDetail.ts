'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QuoteDetailResponse } from '../api/types';
import type { DashboardQuote } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

interface UseDashboardQuoteDetailOptions {
  /** When false, skips fetch (e.g. create-quote screen that shares this hook shape). */
  enabled?: boolean;
}

interface UseDashboardQuoteDetailResult {
  quote: DashboardQuote | null;
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadQuote: () => Promise<void>;
}

export function useDashboardQuoteDetail(
  quoteId: string,
  options?: UseDashboardQuoteDetailOptions
): UseDashboardQuoteDetailResult {
  const enabled = options?.enabled !== false;

  const [quote, setQuote] = useState<DashboardQuote | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(() =>
    enabled ? 'loading' : 'ready'
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadQuote = useCallback(async () => {
    if (!enabled) {
      setLoadStatus('ready');
      setLoadError(null);
      setQuote(null);
      return;
    }

    const id = quoteId.trim();
    if (!id) {
      setLoadStatus('error');
      setLoadError('Quote not found');
      setQuote(null);
      return;
    }

    setLoadStatus('loading');
    setLoadError(null);
    try {
      const response = await fetch(`/api/quotes/${encodeURIComponent(id)}`, {
        method: 'GET',
      });
      const json = (await response
        .json()
        .catch(() => null)) as QuoteDetailResponse | null;

      if (!response.ok || !json?.success || !json.quote) {
        throw new Error(json?.error || 'Failed to load quote');
      }

      setQuote(json.quote);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load quote';
      setLoadError(message);
      setLoadStatus('error');
      setQuote(null);
    }
  }, [quoteId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoadStatus('ready');
      setLoadError(null);
      setQuote(null);
      return;
    }
    void reloadQuote();
  }, [enabled, reloadQuote]);

  return { quote, loadStatus, loadError, reloadQuote };
}
