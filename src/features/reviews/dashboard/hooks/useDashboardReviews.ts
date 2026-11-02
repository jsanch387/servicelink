'use client';

import { deriveReviewsSummary } from '@/features/reviews/utils/deriveReviewsSummary';
import { useCallback, useEffect, useState } from 'react';
import type { ReviewsListResponse } from '../api/types';
import type { PublicProfileReviewsSummary } from '../../types/publicProfile';
import type { DashboardReview } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface UseDashboardReviewsResult {
  reviews: DashboardReview[];
  summary: PublicProfileReviewsSummary;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: string | null;
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadReviews: () => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  /** Local optimistic updates until PATCH /api/reviews/[id] is wired. */
  updateReview: (
    reviewId: string,
    updater: (review: DashboardReview) => DashboardReview
  ) => void;
}

const EMPTY_SUMMARY = deriveReviewsSummary([]);

async function fetchReviewPage(offset: number): Promise<
  Extract<ReviewsListResponse, { success: true }>
> {
  const path = offset > 0 ? `/api/reviews?offset=${offset}` : '/api/reviews';
  const response = await fetch(path, { method: 'GET' });
  const json = (await response
    .json()
    .catch(() => null)) as ReviewsListResponse | null;

  if (!response.ok || !json?.success) {
    const message = json && !json.success ? json.error : 'Failed to load reviews';
    throw new Error(message);
  }

  return json;
}

export function useDashboardReviews(): UseDashboardReviewsResult {
  const [reviews, setReviews] = useState<DashboardReview[]>([]);
  const [summary, setSummary] = useState<PublicProfileReviewsSummary>(EMPTY_SUMMARY);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadReviews = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);
    setLoadMoreError(null);

    try {
      const json = await fetchReviewPage(0);
      setReviews(Array.isArray(json.reviews) ? json.reviews : []);
      setHasMore(json.hasMore === true);
      setSummary(json.summary ?? EMPTY_SUMMARY);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load reviews';
      setLoadError(message);
      setLoadStatus('error');
      setReviews([]);
      setHasMore(false);
      setSummary(EMPTY_SUMMARY);
    }
  }, []);

  const loadMoreReviews = useCallback(async () => {
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const json = await fetchReviewPage(reviews.length);
      setReviews(current => {
        const seen = new Set(current.map(review => review.id));
        const next = (json.reviews ?? []).filter(review => !seen.has(review.id));
        return [...current, ...next];
      });
      setHasMore(json.hasMore === true);
      if (json.summary) setSummary(json.summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load more reviews.';
      setLoadMoreError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [reviews.length]);

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

  return {
    reviews,
    summary,
    hasMore,
    loadingMore,
    loadMoreError,
    loadStatus,
    loadError,
    reloadReviews,
    loadMoreReviews,
    updateReview,
  };
}
