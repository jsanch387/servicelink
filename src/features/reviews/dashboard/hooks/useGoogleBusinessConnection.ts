'use client';

import { API_ROUTES } from '@/constants/routes';
import {
  GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS,
  GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE,
} from '@/features/reviews/google-connect/googleReviewPullCooldown';
import { isGoogleReviewSyncStale } from '@/features/reviews/google-connect/server/googleReviewSyncFreshness';
import { useCallback, useEffect, useRef, useState } from 'react';

type LoadStatus = 'loading' | 'ready' | 'error';

export type UseGoogleBusinessConnectionResult = {
  connected: boolean;
  importedCount: number | null;
  loadStatus: LoadStatus;
  connectLoading: boolean;
  pullLoading: boolean;
  refreshCoolingDown: boolean;
  connectError: string | null;
  /** Bumps after a background refresh so the inbox can reload. */
  reviewReloadNonce: number;
  startConnect: () => Promise<void>;
  pullReviews: () => Promise<boolean>;
};

export function useGoogleBusinessConnection(
  enabled = true
): UseGoogleBusinessConnectionResult {
  const [connected, setConnected] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [reviewReloadNonce, setReviewReloadNonce] = useState(0);
  const [refreshLockedUntil, setRefreshLockedUntil] = useState(0);
  const [, setCooldownTick] = useState(0);
  const autoRefreshStarted = useRef(false);

  const syncedLockUntil = (() => {
    if (!lastSyncedAt) return 0;
    const syncedAt = Date.parse(lastSyncedAt);
    if (Number.isNaN(syncedAt)) return 0;
    return syncedAt + GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS;
  })();
  const refreshLockedUntilEffective = Math.max(
    syncedLockUntil,
    refreshLockedUntil
  );
  const refreshCoolingDown = refreshLockedUntilEffective > Date.now();

  useEffect(() => {
    if (!enabled) {
      setLoadStatus('ready');
      setConnected(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(API_ROUTES.REVIEWS_GOOGLE_STATUS);
        const json = (await response.json().catch(() => null)) as {
          success?: boolean;
          connected?: boolean;
          lastSyncedAt?: string | null;
        } | null;
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setLoadStatus('error');
          return;
        }
        setConnected(json.connected === true);
        setLastSyncedAt(
          typeof json.lastSyncedAt === 'string' ? json.lastSyncedAt : null
        );
        setLoadStatus('ready');
      } catch {
        if (!cancelled) setLoadStatus('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const startConnect = useCallback(async () => {
    if (!enabled) return;
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
  }, [enabled]);

  const pullReviews = useCallback(async (options?: { quiet?: boolean }) => {
    if (!enabled) return false;
    if (!options?.quiet) setConnectError(null);
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
        if (response.status === 429) {
          const retryHeader = Number(response.headers.get('Retry-After'));
          const retrySec =
            Number.isFinite(retryHeader) && retryHeader > 0
              ? retryHeader
              : GOOGLE_REVIEW_MANUAL_PULL_COOLDOWN_MS / 1000;
          setRefreshLockedUntil(Date.now() + retrySec * 1000);
          if (!options?.quiet) {
            setConnectError(
              typeof json?.error === 'string' && json.error.trim()
                ? json.error
                : GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE
            );
          }
          return false;
        }
        if (!options?.quiet) {
          setConnectError(
            typeof json?.error === 'string' && json.error.trim()
              ? json.error
              : 'Could not pull Google reviews.'
          );
        }
        return false;
      }

      setImportedCount(
        typeof json.importedCount === 'number' ? json.importedCount : 0
      );
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch {
      if (!options?.quiet) {
        setConnectError(
          'Something went wrong. Check your connection and try again.'
        );
      }
      return false;
    } finally {
      setPullLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!refreshCoolingDown) return;
    const delay = Math.max(0, refreshLockedUntilEffective - Date.now());
    const timer = window.setTimeout(
      () => setCooldownTick(tick => tick + 1),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [refreshCoolingDown, refreshLockedUntilEffective]);

  useEffect(() => {
    if (!enabled) return;
    if (autoRefreshStarted.current) return;
    if (loadStatus !== 'ready' || !connected) return;
    if (!isGoogleReviewSyncStale(lastSyncedAt)) return;
    autoRefreshStarted.current = true;
    void pullReviews({ quiet: true }).then(ok => {
      if (ok) setReviewReloadNonce(nonce => nonce + 1);
    });
  }, [connected, enabled, lastSyncedAt, loadStatus, pullReviews]);

  return {
    connected,
    importedCount,
    loadStatus,
    connectLoading,
    pullLoading,
    refreshCoolingDown,
    connectError,
    reviewReloadNonce,
    startConnect,
    pullReviews,
  };
}
