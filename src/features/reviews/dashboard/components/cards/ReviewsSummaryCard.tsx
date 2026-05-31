'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ReviewsRatingSummary } from '@/features/business-profile/reviews/components/summary/ReviewsRatingSummary';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { DashboardGlassCard } from '@/features/dashboard';
import React from 'react';

interface ReviewsSummaryCardProps {
  summary: PublicProfileReviewsSummary;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewsSummaryCard: React.FC<ReviewsSummaryCardProps> = ({
  summary,
  bookingFlowLocale = 'en',
}) => {
  return (
    <DashboardGlassCard fillGridCell={false} padding="md" className="w-full">
      <ReviewsRatingSummary
        summary={summary}
        bookingFlowLocale={bookingFlowLocale}
      />
    </DashboardGlassCard>
  );
};
