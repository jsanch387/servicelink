'use client';

import { Button, GlassCard } from '@/components/shared';
import {
  formatReviewDate,
  ReviewOwnerReplyDisplay,
  StarRatingDisplay,
} from '@/features/business-profile/reviews';
import React from 'react';
import type { DashboardReview } from '../../types';
import { ReviewReplyForm } from './ReviewReplyForm';

interface ReviewListRowProps {
  review: DashboardReview;
  locale: string;
  isReplyOpen: boolean;
  onToggleReply: () => void;
  onSendReply: (reviewId: string, body: string) => void;
}

export const ReviewListRow: React.FC<ReviewListRowProps> = ({
  review,
  locale,
  isReplyOpen,
  onToggleReply,
  onSendReply,
}) => {
  const hasReply = Boolean(review.ownerReply?.body?.trim());

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className="border-white/[0.06] bg-white/[0.02]"
      padding="none"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold text-white">
            {review.authorDisplayName}
          </h3>
          <StarRatingDisplay
            rating={review.rating}
            size="sm"
            className="shrink-0"
          />
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-zinc-300">
          {review.body}
        </p>

        <time
          className="mt-3 block text-[11px] text-zinc-600 tabular-nums"
          dateTime={review.createdAt}
        >
          {formatReviewDate(review.createdAt, locale)}
        </time>

        {hasReply && review.ownerReply ? (
          <ReviewOwnerReplyDisplay body={review.ownerReply.body} />
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
