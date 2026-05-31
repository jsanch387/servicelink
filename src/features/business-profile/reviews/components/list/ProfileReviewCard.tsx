'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReview } from '@/features/reviews';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { reviewBodyTextClass } from '../../constants/reviewTypography';
import { ReviewCardHeader } from '../display/ReviewCardHeader';
import { ReviewExpandableText } from '../display/ReviewExpandableText';
import { ReviewOwnerReplyDisplay } from '../display/ReviewOwnerReplyDisplay';

interface ProfileReviewCardProps {
  review: PublicProfileReview;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({
  review,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const locale = bcp47ForBookingLocale(bookingFlowLocale);
  const expandLabels = {
    seeMore: ui.serviceCard.seeMore,
    seeLess: ui.serviceCard.seeLess,
  };

  return (
    <article>
      <ReviewCardHeader
        authorDisplayName={review.authorDisplayName}
        createdAt={review.createdAt}
        rating={review.rating}
        locale={locale}
      />

      <div className="mt-3 sm:mt-4">
        <ReviewExpandableText
          text={review.body}
          variant="reviewBody"
          className={reviewBodyTextClass}
          seeMoreLabel={expandLabels.seeMore}
          seeLessLabel={expandLabels.seeLess}
        />
      </div>

      {review.ownerReply ? (
        <ReviewOwnerReplyDisplay
          body={review.ownerReply.body}
          className="mt-4 sm:mt-5"
          seeMoreLabel={expandLabels.seeMore}
          seeLessLabel={expandLabels.seeLess}
        />
      ) : null}
    </article>
  );
};
