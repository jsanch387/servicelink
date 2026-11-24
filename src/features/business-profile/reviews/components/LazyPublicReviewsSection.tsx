'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type {
  PublicProfileReview,
  PublicProfileReviewsSummary,
} from '@/features/reviews';
import { getPublicProfileReviewsApiPath } from '@/features/reviews/utils/getPublicProfileReviewsApiPath';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useEffect, useState } from 'react';
import { ReviewsSectionLoading } from './ReviewsSectionLoading';
import { ProfileReviewsList } from './list/ProfileReviewsList';
import { ProfileReviewsSummary } from './summary/ProfileReviewsSummary';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type ReviewsFeedPage = {
  reviews: PublicProfileReview[];
  hasMore: boolean;
};

interface LazyPublicReviewsSectionProps {
  businessSlug: string;
  summary: PublicProfileReviewsSummary;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Fetch when the Reviews tab is active. */
  isActive: boolean;
}

export const LazyPublicReviewsSection: React.FC<
  LazyPublicReviewsSectionProps
> = ({ businessSlug, summary, bookingFlowLocale = 'en', isActive }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [reviews, setReviews] = useState<PublicProfileReview[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const fetchReviews = useCallback(
    async (offset: number) => {
      const isFirstPage = offset === 0;
      if (isFirstPage) {
        setLoadState('loading');
        setLoadMoreError(false);
      } else {
        setLoadingMore(true);
        setLoadMoreError(false);
      }

      try {
        const res = await fetch(
          getPublicProfileReviewsApiPath(businessSlug, offset),
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          }
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: ReviewsFeedPage;
          error?: string;
        };

        if (!res.ok || !json.success || !json.data) {
          if (isFirstPage) setLoadState('error');
          else setLoadMoreError(true);
          return;
        }

        const serverReviews = json.data.reviews ?? [];
        setReviews(current => {
          if (isFirstPage) return serverReviews;
          const seen = new Set(current.map(review => review.id));
          const next = serverReviews.filter(review => !seen.has(review.id));
          return [...current, ...next];
        });
        setHasMore(json.data.hasMore);
        if (isFirstPage) setLoadState('ready');
      } catch {
        if (isFirstPage) setLoadState('error');
        else setLoadMoreError(true);
      } finally {
        if (!isFirstPage) setLoadingMore(false);
      }
    },
    [businessSlug]
  );

  useEffect(() => {
    if (!isActive) return;
    if (reviews.length > 0 || loadState === 'loading') return;
    if (loadState === 'ready' || loadState === 'error') return;
    void fetchReviews(0);
  }, [isActive, reviews.length, loadState, fetchReviews]);

  const showServiceLinkSummary = summary.reviewCount > 0;

  return (
    <section
      className="px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8"
      aria-label={ui.profile.reviewsSectionTitle}
    >
      {showServiceLinkSummary ? (
        <ProfileReviewsSummary
          bookingFlowLocale={bookingFlowLocale}
          summary={summary}
        />
      ) : null}

      {loadState === 'loading' || loadState === 'idle' ? (
        <ReviewsSectionLoading ariaLabel={ui.profile.reviewsLoadingAriaLabel} />
      ) : null}

      {loadState === 'error' ? (
        <div className="-mx-4 border-t border-white/[0.06] px-4 py-8 text-center sm:-mx-8 sm:px-8">
          <p className="text-sm text-zinc-500">{ui.profile.reviewsLoadError}</p>
          <button
            type="button"
            onClick={() => setLoadState('idle')}
            className="mt-3 cursor-pointer text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline touch-manipulation"
          >
            {ui.profile.reviewsRetry}
          </button>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <ProfileReviewsList
          reviews={reviews}
          bookingFlowLocale={bookingFlowLocale}
        />
      ) : null}

      {loadState === 'ready' && (hasMore || loadMoreError) ? (
        <div className="px-4 py-6 text-center sm:px-8">
          {loadMoreError ? (
            <p className="mb-3 text-sm text-zinc-500">
              {ui.profile.reviewsLoadMoreError}
            </p>
          ) : null}
          {hasMore ? (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void fetchReviews(reviews.length)}
              className="cursor-pointer text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline disabled:cursor-not-allowed disabled:text-zinc-500 disabled:no-underline"
            >
              {ui.profile.reviewsLoadMore}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
