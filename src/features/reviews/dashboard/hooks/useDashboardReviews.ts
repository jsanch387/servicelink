'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReviewsListResponse } from '../api/types';
import type { DashboardReview } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface UseDashboardReviewsResult {
  reviews: DashboardReview[];
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadReviews: () => Promise<void>;
  /** Local optimistic updates until PATCH /api/reviews/[id] is wired. */
  updateReview: (
    reviewId: string,
    updater: (review: DashboardReview) => DashboardReview
  ) => void;
}

export function useDashboardReviews(): UseDashboardReviewsResult {
  const [reviews, setReviews] = useState<DashboardReview[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadReviews = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);

    try {
      const response = await fetch('/api/reviews', { method: 'GET' });
      const json = (await response
        .json()
        .catch(() => null)) as ReviewsListResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load reviews');
      }

      setReviews(Array.isArray(json.reviews) ? json.reviews : []);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load reviews';
      setLoadError(message);
      setLoadStatus('error');
      setReviews([]);
    }
  }, []);

  const updateReview = useCallback(
    (
      reviewId: string,
      updater: (review: DashboardReview) => DashboardReview
    ) => {
      setReviews(prev =>
        prev.map(review => (review.id === reviewId ? updater(review) : review))
      );
    },
    []
  );

  useEffect(() => {
    void reloadReviews();
  }, [reloadReviews]);

  return { reviews, loadStatus, loadError, reloadReviews, updateReview };
}
