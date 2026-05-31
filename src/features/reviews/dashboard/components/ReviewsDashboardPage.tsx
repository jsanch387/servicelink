'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { deriveReviewsSummary } from '@/features/reviews/utils/deriveReviewsSummary';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useMemo, useState } from 'react';
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

export interface ReviewsDashboardPageProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewsDashboardPage: React.FC<ReviewsDashboardPageProps> = ({
  bookingFlowLocale = 'en',
}) => {
  const locale = bcp47ForBookingLocale(bookingFlowLocale);
  const [filter, setFilter] = useState<ReviewsDashboardFilterId>('all');
  const [reviews, setReviews] = useState<DashboardReview[]>([]);
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

  const handleSendReply = useCallback((reviewId: string, body: string) => {
    const repliedAt = new Date().toISOString();
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId ? { ...r, ownerReply: { body, repliedAt } } : r
      )
    );
    setOpenReplyId(null);
  }, []);

  const handleToggleReply = useCallback((reviewId: string) => {
    setOpenReplyId(prev => (prev === reviewId ? null : reviewId));
  }, []);

  const hasAnyReviews = reviews.length > 0;

  return (
    <ReviewsDashboardShell>
      <ReviewsDashboardHeader needsReplyCount={needsReplyCount} />

      <div className="mb-6 space-y-4 sm:mb-8">
        {hasAnyReviews ? (
          <ReviewsSummaryCard
            summary={summary}
            bookingFlowLocale={bookingFlowLocale}
          />
        ) : null}
        <ReviewsCollectCard />
      </div>

      {hasAnyReviews ? (
        <div className="mb-4">
          <ReviewsFilterPills value={filter} onChange={setFilter} />
          <p className="mt-3 text-xs text-zinc-500">
            Showing {sorted.length} of {reviews.length} reviews
          </p>
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <ReviewsListEmptyState filter={filter} hasAnyReviews={hasAnyReviews} />
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
    </ReviewsDashboardShell>
  );
};
