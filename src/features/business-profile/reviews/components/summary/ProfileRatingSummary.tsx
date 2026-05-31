'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { StarIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { profileReviewStarTextClass } from '../../constants/reviewStars';
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
      className={`flex items-center justify-center gap-1 text-sm leading-snug ${className}`}
      role="img"
      aria-label={ui.profile.ratingAriaLabel(formattedAverage)}
    >
      <StarIcon
        className={`h-4 w-4 shrink-0 ${profileReviewStarTextClass}`}
        aria-hidden
      />
      <span className="font-medium tabular-nums text-white">
        {formattedAverage}
      </span>
    </p>
  );
};
