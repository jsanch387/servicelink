'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { StarIcon, reviewStarFilledClass } from '@/icons';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { formatAverageRating } from '../../utils/reviewDisplay';

interface ProfileRatingSummaryProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
  summary: PublicProfileReviewsSummary | null | undefined;
  className?: string;
}

export const ProfileRatingSummary: React.FC<ProfileRatingSummaryProps> = ({
  bookingFlowLocale = 'en',
  summary,
  className = '',
}) => {
  if (!summary || summary.reviewCount < 1) {
    return null;
  }

  const ui = publicBookingUi(bookingFlowLocale);
  const formattedAverage = formatAverageRating(summary.averageRating);

  return (
    <p
      className={`inline-flex items-center justify-center gap-1.5 text-sm leading-none ${className}`}
      role="img"
      aria-label={ui.profile.ratingAriaLabel(formattedAverage)}
    >
      <span className="inline-flex shrink-0 items-center justify-center">
        <StarIcon className={`h-4 w-4 ${reviewStarFilledClass}`} aria-hidden />
      </span>
      <span className="font-semibold tabular-nums text-white">
        {formattedAverage}
      </span>
    </p>
  );
};
