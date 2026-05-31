'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import React from 'react';
import { ReviewsRatingSummary } from './ReviewsRatingSummary';

interface ProfileReviewsSummaryProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
  summary: PublicProfileReviewsSummary;
}

export const ProfileReviewsSummary: React.FC<ProfileReviewsSummaryProps> = ({
  bookingFlowLocale = 'en',
  summary,
}) => {
  return (
    <header className="pb-8">
      <ReviewsRatingSummary
        summary={summary}
        bookingFlowLocale={bookingFlowLocale}
      />
    </header>
  );
};
