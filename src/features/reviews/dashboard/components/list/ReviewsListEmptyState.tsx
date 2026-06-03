'use client';

import { StarIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { ReviewsDashboardFilterId } from '../../types';

interface ReviewsListEmptyStateProps {
  filter: ReviewsDashboardFilterId;
  hasAnyReviews: boolean;
}

function emptyCopy(
  filter: ReviewsDashboardFilterId,
  hasAnyReviews: boolean
): { title: string; description: string } {
  if (!hasAnyReviews) {
    return {
      title: 'No reviews yet',
      description:
        'When customers leave reviews after a completed visit, they show up here.',
    };
  }
  if (filter === 'needs_reply') {
    return {
      title: 'All caught up',
      description: 'You have replied to every review. Nice work.',
    };
  }
  if (filter === 'replied') {
    return {
      title: 'No replied reviews',
      description: 'Replies you send will show up in this filter.',
    };
  }
  return {
    title: 'No reviews',
    description: 'Try another filter.',
  };
}

export const ReviewsListEmptyState: React.FC<ReviewsListEmptyStateProps> = ({
  filter,
  hasAnyReviews,
}) => {
  const { title, description } = emptyCopy(filter, hasAnyReviews);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center sm:py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/[0.08]">
        <StarIcon className="h-7 w-7 text-zinc-600" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-zinc-200">{title}</h2>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  );
};
