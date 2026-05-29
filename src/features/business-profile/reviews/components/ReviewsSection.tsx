'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import {
  MOCK_PROFILE_REVIEWS,
  MOCK_PROFILE_REVIEW_SUMMARY,
} from '../constants/mockProfileReviews';
import { ProfileReviewCard } from './list/ProfileReviewCard';
import { ProfileReviewsSummary } from './summary/ProfileReviewsSummary';

interface ReviewsSectionProps {
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const { averageRating, reviewCount } = MOCK_PROFILE_REVIEW_SUMMARY;

  return (
    <section
      className="px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8"
      aria-label={ui.profile.reviewsSectionTitle}
    >
      <ProfileReviewsSummary
        bookingFlowLocale={bookingFlowLocale}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      <ul className="-mx-4 divide-y divide-white/[0.06] border-t border-white/[0.06] sm:-mx-8">
        {MOCK_PROFILE_REVIEWS.map(review => (
          <li key={review.id} className="px-4 py-8 sm:px-8">
            <ProfileReviewCard
              review={review}
              bookingFlowLocale={bookingFlowLocale}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
