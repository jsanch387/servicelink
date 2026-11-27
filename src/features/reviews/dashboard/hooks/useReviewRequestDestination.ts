'use client';

import { API_ROUTES } from '@/constants/routes';
import {
  DEFAULT_REVIEW_REQUEST_DESTINATION,
  type ReviewRequestDestination,
} from '@/features/reviews/server/reviewRequestDestination';
import { useCallback, useEffect, useState } from 'react';

type LoadStatus = 'loading' | 'ready' | 'error';

export type UseReviewRequestDestinationResult = {
  destination: ReviewRequestDestination;
  loadStatus: LoadStatus;
  saveLoading: boolean;
  saveError: string | null;
  setDestination: (destination: ReviewRequestDestination) => Promise<boolean>;
  resetLocalDestination: () => void;
};

export function useReviewRequestDestination(
  enabled = true
): UseReviewRequestDestinationResult {
  const [destination, setDestinationState] = useState<ReviewRequestDestination>(
    DEFAULT_REVIEW_REQUEST_DESTINATION
  );
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoadStatus('ready');
      setDestinationState(DEFAULT_REVIEW_REQUEST_DESTINATION);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(API_ROUTES.REVIEWS_SETTINGS);
        const json = (await response.json().catch(() => null)) as {
          success?: boolean;
          reviewRequestDestination?: unknown;
          error?: string;
        } | null;
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          setLoadStatus('error');
          return;
        }
        setDestinationState(
          json.reviewRequestDestination === 'google'
            ? 'google'
            : DEFAULT_REVIEW_REQUEST_DESTINATION
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

  const setDestination = useCallback(
    async (next: ReviewRequestDestination) => {
      if (!enabled) return false;
      setSaveError(null);
      setSaveLoading(true);
      const previous = destination;
      setDestinationState(next);
      try {
        const response = await fetch(API_ROUTES.REVIEWS_SETTINGS, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewRequestDestination: next }),
        });
        const json = (await response.json().catch(() => null)) as {
          success?: boolean;
          reviewRequestDestination?: unknown;
          error?: string;
        } | null;

        if (!response.ok || !json?.success) {
          setDestinationState(previous);
          setSaveError(
            typeof json?.error === 'string' && json.error.trim()
              ? json.error
              : 'Could not save review request settings.'
          );
          return false;
        }

        setDestinationState(
          json.reviewRequestDestination === 'google'
            ? 'google'
            : DEFAULT_REVIEW_REQUEST_DESTINATION
        );
        return true;
      } catch {
        setDestinationState(previous);
        setSaveError(
          'Something went wrong. Check your connection and try again.'
        );
        return false;
      } finally {
        setSaveLoading(false);
      }
    },
    [destination, enabled]
  );

  const resetLocalDestination = useCallback(() => {
    setDestinationState(DEFAULT_REVIEW_REQUEST_DESTINATION);
    setSaveError(null);
  }, []);

  return {
    destination,
    loadStatus,
    saveLoading,
    saveError,
    setDestination,
    resetLocalDestination,
  };
}
