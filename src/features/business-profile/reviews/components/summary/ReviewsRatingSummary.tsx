'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { REVIEW_STAR_COLOR } from '@/icons';
import { formatAverageRating } from '../../utils/reviewDisplay';
import { StarRatingDisplay } from '../display/StarRatingDisplay';

interface ReviewsRatingSummaryProps {
  summary: PublicProfileReviewsSummary;
  bookingFlowLocale?: PublicBookingFlowLocale;
  className?: string;
  /** Big score on top, stars and count stacked under it. */
  stackScore?: boolean;
}

/** Star average, count, and breakdown bars — shared by public profile and dashboard. */
export const ReviewsRatingSummary: React.FC<ReviewsRatingSummaryProps> = ({
  summary,
  bookingFlowLocale = 'en',
  className = '',
  stackScore = false,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const formattedAverage = formatAverageRating(summary.averageRating);
  const { reviewCount, breakdown } = summary;

  return (
    <div
      className={
        stackScore
          ? `grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] ${className}`
          : `flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 ${className}`
      }
    >
      <div
        className={
          stackScore
            ? 'flex flex-col items-start gap-3 sm:gap-4'
            : 'flex shrink-0 items-center gap-3 sm:gap-4'
        }
        aria-label={`${ui.profile.ratingAriaLabel(formattedAverage)}. ${ui.profile.reviewCountLabel(reviewCount)}`}
      >
        <p
          className="text-5xl font-bold tabular-nums leading-none tracking-tight text-white"
          aria-hidden
        >
          {formattedAverage}
        </p>
        <div className="flex flex-col gap-1.5" aria-hidden>
          <StarRatingDisplay rating={summary.averageRating} size="md" />
          <p className="text-sm leading-snug text-zinc-500">
            {ui.profile.reviewCountLabel(reviewCount)}
          </p>
        </div>
      </div>

      <div
        className={`w-full min-w-0 space-y-2 ${stackScore ? '' : 'sm:flex-1'}`}
        role="presentation"
        aria-hidden
      >
        {breakdown.map(({ stars, percent }) => (
          <div key={stars} className="flex items-center gap-3">
            <span className="w-3 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-500">
              {stars}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: REVIEW_STAR_COLOR,
                }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-zinc-600">
              {percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
