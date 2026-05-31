'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsData } from '@/features/reviews';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { ProfileReviewsList } from './list/ProfileReviewsList';
import { ProfileReviewsSummary } from './summary/ProfileReviewsSummary';

interface ReviewsSectionProps {
  data: PublicProfileReviewsData;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  data,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);

  return (
    <section
      className="px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8"
      aria-label={ui.profile.reviewsSectionTitle}
    >
      <ProfileReviewsSummary
        bookingFlowLocale={bookingFlowLocale}
        summary={data.summary}
      />
      <ProfileReviewsList
        reviews={data.reviews}
        bookingFlowLocale={bookingFlowLocale}
      />
    </section>
  );
};
