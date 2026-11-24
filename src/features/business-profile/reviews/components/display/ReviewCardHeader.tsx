'use client';

import { GoogleIcon } from '@/components/shared';
import React from 'react';
import {
  reviewAuthorNameClass,
  reviewDateClass,
} from '../../constants/reviewTypography';
import { formatReviewDate } from '../../utils/reviewDisplay';
import { StarRatingDisplay } from './StarRatingDisplay';

interface ReviewCardHeaderProps {
  authorDisplayName: string;
  createdAt: string;
  rating: number;
  locale: string;
  /** Use `h3` on dashboard list rows; default `p` on public profile cards. */
  authorAs?: 'p' | 'h3';
  source?: 'servicelink' | 'google';
}

export const ReviewCardHeader: React.FC<ReviewCardHeaderProps> = ({
  authorDisplayName,
  createdAt,
  rating,
  locale,
  authorAs = 'p',
  source,
}) => {
  const AuthorTag = authorAs;

  return (
    <header className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="min-w-0 flex-1">
        <AuthorTag className={reviewAuthorNameClass}>
          {authorDisplayName}
        </AuthorTag>
        <time className={`mt-1 block ${reviewDateClass}`} dateTime={createdAt}>
          {formatReviewDate(createdAt, locale)}
        </time>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        <StarRatingDisplay rating={rating} size="sm" />
        {source === 'google' ? (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <GoogleIcon className="h-3 w-3" />
            Google
          </span>
        ) : null}
      </div>
    </header>
  );
};
