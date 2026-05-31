'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { MockProfileReview } from '../../constants/mockProfileReviews';
import { formatReviewDate } from '../../utils/reviewDisplay';
import { ReviewOwnerReplyDisplay } from '../display/ReviewOwnerReplyDisplay';
import { StarRatingDisplay } from '../display/StarRatingDisplay';

interface ProfileReviewCardProps {
  review: MockProfileReview;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({
  review,
  bookingFlowLocale = 'en',
}) => {
  const locale = bcp47ForBookingLocale(bookingFlowLocale);

  return (
    <article>
      <header className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[15px] font-semibold leading-snug text-zinc-100">
          {review.authorDisplayName}
        </p>
        <StarRatingDisplay
          rating={review.rating}
          size="sm"
          className="shrink-0"
        />
      </header>

      <p className="mt-4 text-[15px] leading-relaxed text-zinc-300">
        {review.body}
      </p>

      <time
        className="mt-3 block text-[11px] text-zinc-600 tabular-nums"
        dateTime={review.createdAt}
      >
        {formatReviewDate(review.createdAt, locale)}
      </time>

      {review.ownerReply ? (
        <ReviewOwnerReplyDisplay body={review.ownerReply.body} />
      ) : null}
    </article>
  );
};
