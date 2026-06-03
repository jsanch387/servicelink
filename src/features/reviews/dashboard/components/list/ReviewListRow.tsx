'use client';

import { Button, GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  reviewBodyTextClass,
  ReviewCardHeader,
  ReviewExpandableText,
  ReviewOwnerReplyDisplay,
} from '@/features/business-profile/reviews';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { DashboardReview } from '../../types';
import { ReviewReplyForm } from './ReviewReplyForm';

interface ReviewListRowProps {
  review: DashboardReview;
  locale: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  isReplyOpen: boolean;
  onToggleReply: () => void;
  onSendReply: (reviewId: string, body: string) => void;
}

export const ReviewListRow: React.FC<ReviewListRowProps> = ({
  review,
  locale,
  bookingFlowLocale = 'en',
  isReplyOpen,
  onToggleReply,
  onSendReply,
}) => {
  const hasReply = Boolean(review.ownerReply?.body?.trim());
  const ui = publicBookingUi(bookingFlowLocale);
  const expandLabels = {
    seeMore: ui.serviceCard.seeMore,
    seeLess: ui.serviceCard.seeLess,
  };

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className="border-white/[0.06] bg-white/[0.02]"
      padding="none"
    >
      <div className="p-3.5 sm:p-5">
        <ReviewCardHeader
          authorDisplayName={review.authorDisplayName}
          createdAt={review.createdAt}
          rating={review.rating}
          locale={locale}
          authorAs="h3"
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

        {hasReply && review.ownerReply ? (
          <ReviewOwnerReplyDisplay
            body={review.ownerReply.body}
            className="mt-4 sm:mt-5"
            seeMoreLabel={expandLabels.seeMore}
            seeLessLabel={expandLabels.seeLess}
          />
        ) : null}

        {!hasReply && !isReplyOpen ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4 w-full sm:w-auto"
            onClick={onToggleReply}
          >
            Reply
          </Button>
        ) : null}

        {!hasReply && isReplyOpen ? (
          <ReviewReplyForm
            onSend={body => onSendReply(review.id, body)}
            onCancel={onToggleReply}
          />
        ) : null}
      </div>
    </GlassCard>
  );
};
