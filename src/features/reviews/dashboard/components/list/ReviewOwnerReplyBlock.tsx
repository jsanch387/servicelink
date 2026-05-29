'use client';

import { formatReviewDate } from '@/features/business-profile/reviews';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ReviewOwnerReplyBlockProps {
  body: string;
  repliedAt: string;
  locale: string;
}

export const ReviewOwnerReplyBlock: React.FC<ReviewOwnerReplyBlockProps> = ({
  body,
  repliedAt,
  locale,
}) => {
  return (
    <figure className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <figcaption className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" aria-hidden />
        Your response
      </figcaption>
      <blockquote className="mt-2 text-sm leading-relaxed text-zinc-400">
        {body}
      </blockquote>
      <time
        className="mt-2 block text-[11px] text-zinc-600 tabular-nums"
        dateTime={repliedAt}
      >
        {formatReviewDate(repliedAt, locale)}
      </time>
    </figure>
  );
};
