'use client';

import { Button, GlassCard } from '@/components/shared';
import {
  formatReviewDate,
  StarRatingDisplay,
} from '@/features/business-profile/reviews';
import React from 'react';
import type { DashboardReview } from '../../types';
import { ReviewOwnerReplyBlock } from './ReviewOwnerReplyBlock';
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
  const needsReply = !hasReply;

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className="border-white/[0.06] bg-white/[0.02]"
      padding="none"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-white">
              {review.authorDisplayName}
            </h3>
            {needsReply ? (
              <span className="mt-1 inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200/90 ring-1 ring-inset ring-amber-500/20">
                Needs reply
              </span>
            ) : (
              <span className="mt-1 inline-flex text-xs font-medium text-zinc-500">
                Replied
              </span>
            )}
          </div>
          <StarRatingDisplay
            rating={review.rating}
            size="sm"
            className="shrink-0 pt-0.5"
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
          <ReviewOwnerReplyBlock
            body={review.ownerReply.body}
            repliedAt={review.ownerReply.repliedAt}
            locale={locale}
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
