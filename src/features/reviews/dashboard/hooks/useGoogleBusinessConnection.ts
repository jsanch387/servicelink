'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useState } from 'react';

type LoadStatus = 'loading' | 'ready' | 'error';

export type UseGoogleBusinessConnectionResult = {
  connected: boolean;
  importedCount: number | null;
  loadStatus: LoadStatus;
  connectLoading: boolean;
  pullLoading: boolean;
  connectError: string | null;
  startConnect: () => Promise<void>;
  pullReviews: () => Promise<boolean>;
};

export function useGoogleBusinessConnection(): UseGoogleBusinessConnectionResult {
  const [connected, setConnected] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(API_ROUTES.REVIEWS_GOOGLE_STATUS);
        const json = (await response.json().catch(() => null)) as {
          success?: boolean;
          connected?: boolean;
        } | null;
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setLoadStatus('error');
          return;
        }
        setConnected(json.connected === true);
        setLoadStatus('ready');
      } catch {
        if (!cancelled) setLoadStatus('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const startConnect = useCallback(async () => {
    setConnectError(null);
    setConnectLoading(true);
    try {
      const response = await fetch(API_ROUTES.REVIEWS_GOOGLE_CONNECT, {
        method: 'POST',
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !json?.success || typeof json.url !== 'string') {
        setConnectError(
          typeof json?.error === 'string' && json.error.trim()
            ? json.error
            : 'Could not start Google connect.'
        );
        return;
      }

      window.location.assign(json.url);
    } catch {
      setConnectError(
        'Something went wrong. Check your connection and try again.'
      );
    } finally {
      setConnectLoading(false);
    }
  }, []);

  const pullReviews = useCallback(async () => {
    setConnectError(null);
    setPullLoading(true);
    try {
      const response = await fetch(API_ROUTES.REVIEWS_GOOGLE_PULL, {
        method: 'POST',
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        importedCount?: number;
        error?: string;
      } | null;

      if (!response.ok || !json?.success) {
        setConnectError(
          typeof json?.error === 'string' && json.error.trim()
            ? json.error
            : 'Could not pull Google reviews.'
        );
        return false;
      }

      setImportedCount(
        typeof json.importedCount === 'number' ? json.importedCount : 0
      );
      return true;
    } catch {
      setConnectError(
        'Something went wrong. Check your connection and try again.'
      );
      return false;
    } finally {
      setPullLoading(false);
    }
  }, []);

  return {
    connected,
    importedCount,
    loadStatus,
    connectLoading,
    pullLoading,
    connectError,
    startConnect,
    pullReviews,
  };
}
