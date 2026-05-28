'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import {
  MOCK_PROFILE_RATING_BREAKDOWN,
  MOCK_PROFILE_REVIEW_SUMMARY,
} from '../constants/mockProfileReviews';
import { PROFILE_REVIEW_STAR_COLOR } from '../constants/reviewStars';
import { formatAverageRating } from '../utils/reviewDisplay';
import { StarRatingDisplay } from './StarRatingDisplay';

interface ProfileReviewsSummaryProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
  averageRating?: number;
  reviewCount?: number;
}

export const ProfileReviewsSummary: React.FC<ProfileReviewsSummaryProps> = ({
  bookingFlowLocale = 'en',
  averageRating = MOCK_PROFILE_REVIEW_SUMMARY.averageRating,
  reviewCount = MOCK_PROFILE_REVIEW_SUMMARY.reviewCount,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const formattedAverage = formatAverageRating(averageRating);

  return (
    <header className="pb-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div
          className="flex items-start gap-3 sm:gap-4"
          aria-label={`${ui.profile.ratingAriaLabel(formattedAverage)}. ${ui.profile.reviewCountLabel(reviewCount)}`}
        >
          <p
            className="text-5xl font-semibold tabular-nums leading-none tracking-tight text-white"
            aria-hidden
          >
            {formattedAverage}
          </p>
          <div className="flex flex-col gap-1.5 pt-2" aria-hidden>
            <StarRatingDisplay rating={averageRating} size="md" />
            <p className="text-sm leading-snug text-zinc-500">
              {ui.profile.reviewCountLabel(reviewCount)}
            </p>
          </div>
        </div>

        <div
          className="w-full space-y-2 sm:max-w-[280px] sm:flex-1"
          role="presentation"
          aria-hidden
        >
          {MOCK_PROFILE_RATING_BREAKDOWN.map(({ stars, percent }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="w-3 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-500">
                {stars}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: PROFILE_REVIEW_STAR_COLOR,
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
    </header>
  );
};
