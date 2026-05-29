'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { StarIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { MOCK_PROFILE_REVIEW_SUMMARY } from '../../constants/mockProfileReviews';
import { profileReviewStarTextClass } from '../../constants/reviewStars';
import { formatAverageRating } from '../../utils/reviewDisplay';

interface ProfileRatingSummaryProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
  averageRating?: number;
  className?: string;
}

export const ProfileRatingSummary: React.FC<ProfileRatingSummaryProps> = ({
  bookingFlowLocale = 'en',
  averageRating = MOCK_PROFILE_REVIEW_SUMMARY.averageRating,
  className = '',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const formattedAverage = formatAverageRating(averageRating);

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
      <span
        className={`font-medium tabular-nums ${profileReviewStarTextClass}`}
      >
        {formattedAverage}
      </span>
    </p>
  );
};
