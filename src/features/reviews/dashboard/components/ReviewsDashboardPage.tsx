'use client';

import { Button } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { deriveReviewsSummary } from '@/features/reviews/utils/deriveReviewsSummary';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useMemo, useState } from 'react';
import { useDashboardReviews } from '../hooks/useDashboardReviews';
import type { DashboardReview, ReviewsDashboardFilterId } from '../types';
import {
  countReviewsNeedingReply,
  reviewMatchesFilter,
} from '../utils/reviewFilters';
import { ReviewsCollectCard } from './cards/ReviewsCollectCard';
import { ReviewsSummaryCard } from './cards/ReviewsSummaryCard';
import { ReviewListRow } from './list/ReviewListRow';
import { ReviewsDashboardHeader } from './ReviewsDashboardHeader';
import { ReviewsDashboardShell } from './ReviewsDashboardShell';
import { ReviewsFilterPills } from './list/ReviewsFilterPills';
import { ReviewsListEmptyState } from './list/ReviewsListEmptyState';
import { ReviewsDashboardSkeleton } from './list/ReviewsDashboardSkeleton';

export interface ReviewsDashboardPageProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewsDashboardPage: React.FC<ReviewsDashboardPageProps> = ({
  bookingFlowLocale = 'en',
}) => {
  const locale = bcp47ForBookingLocale(bookingFlowLocale);
  const { reviews, loadStatus, loadError, reloadReviews, updateReview } =
    useDashboardReviews();
  const [filter, setFilter] = useState<ReviewsDashboardFilterId>('all');
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  const summary = useMemo(() => deriveReviewsSummary(reviews), [reviews]);

  const filtered = useMemo(
    () => reviews.filter(r => reviewMatchesFilter(r, filter)),
    [reviews, filter]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filtered]
  );

  const needsReplyCount = useMemo(
    () => countReviewsNeedingReply(reviews),
    [reviews]
  );

  const handleSendReply = useCallback(
    async (reviewId: string, body: string) => {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerReplyBody: body }),
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        review?: DashboardReview;
        error?: string;
      } | null;

      if (!response.ok || !json?.success || !json.review) {
        throw new Error(json?.error || 'Failed to send reply');
      }

      updateReview(reviewId, () => json.review!);
      setOpenReplyId(null);
    },
    [updateReview]
  );

  const handleToggleReply = useCallback((reviewId: string) => {
    setOpenReplyId(prev => (prev === reviewId ? null : reviewId));
  }, []);

  const isReady = loadStatus === 'ready';
  const hasAnyReviews = reviews.length > 0;
  /** Full skeleton only on first load — avoids flashing over existing data on retry. */
  const showLoadingSkeleton = loadStatus === 'loading' && !hasAnyReviews;

  return (
    <ReviewsDashboardShell>
      <ReviewsDashboardHeader needsReplyCount={isReady ? needsReplyCount : 0} />

      <div className="mb-6">
        <ReviewsCollectCard />
      </div>

      {showLoadingSkeleton ? (
        <ReviewsDashboardSkeleton />
      ) : loadStatus === 'error' ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:p-5">
          <p className="text-sm text-red-200">
            {loadError || 'Failed to load reviews.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void reloadReviews()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {hasAnyReviews ? (
            <div className="mb-6">
              <ReviewsSummaryCard
                summary={summary}
                bookingFlowLocale={bookingFlowLocale}
              />
            </div>
          ) : null}

          {hasAnyReviews ? (
            <div className="mb-4">
              <ReviewsFilterPills value={filter} onChange={setFilter} />
              <p className="mt-3 text-xs text-zinc-500">
                Showing {sorted.length} of {reviews.length} reviews
              </p>
            </div>
          ) : null}

          {!hasAnyReviews ? (
            <ReviewsListEmptyState filter={filter} hasAnyReviews={false} />
          ) : sorted.length === 0 ? (
            <ReviewsListEmptyState filter={filter} hasAnyReviews />
          ) : (
            <ul className="flex list-none flex-col gap-2 pb-8 sm:gap-3 sm:pb-10">
              {sorted.map(review => (
                <li key={review.id}>
                  <ReviewListRow
                    review={review}
                    locale={locale}
                    bookingFlowLocale={bookingFlowLocale}
                    isReplyOpen={openReplyId === review.id}
                    onToggleReply={() => handleToggleReply(review.id)}
                    onSendReply={handleSendReply}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </ReviewsDashboardShell>
  );
};
