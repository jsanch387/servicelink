'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReview } from '@/features/reviews';
import React from 'react';
import { ProfileReviewCard } from './ProfileReviewCard';

interface ProfileReviewsListProps {
  reviews: PublicProfileReview[];
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileReviewsList: React.FC<ProfileReviewsListProps> = ({
  reviews,
  bookingFlowLocale = 'en',
}) => {
  return (
    <ul className="-mx-4 divide-y divide-white/[0.06] border-t border-white/[0.06] sm:-mx-8">
      {reviews.map(review => (
        <li key={review.id} className="px-4 py-6 sm:px-8 sm:py-8">
          <ProfileReviewCard
            review={review}
            bookingFlowLocale={bookingFlowLocale}
          />
        </li>
      ))}
    </ul>
  );
};
