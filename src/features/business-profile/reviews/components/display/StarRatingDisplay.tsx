'use client';

import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { profileReviewStarTextClass } from '../../constants/reviewStars';

const SIZE_CLASS = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

export type StarRatingDisplaySize = keyof typeof SIZE_CLASS;

interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: StarRatingDisplaySize;
  className?: string;
  ariaLabel?: string;
}

function clampRating(value: number, maxStars: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(maxStars, Math.max(0, value));
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  className = '',
  ariaLabel,
}) => {
  const safeRating = clampRating(rating, maxStars);
  const iconClass = SIZE_CLASS[size];

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={
        ariaLabel ?? `${safeRating.toFixed(1)} out of ${maxStars} stars`
      }
    >
      {Array.from({ length: maxStars }, (_, index) => {
        const fill = Math.min(1, Math.max(0, safeRating - index));
        const starKey = `star-${index}`;

        if (fill >= 1) {
          return (
            <StarSolidIcon
              key={starKey}
              className={`${iconClass} shrink-0 ${profileReviewStarTextClass}`}
              aria-hidden
            />
          );
        }

        if (fill > 0) {
          return (
            <span
              key={starKey}
              className={`relative inline-flex shrink-0 ${iconClass}`}
            >
              <StarOutlineIcon
                className={`${iconClass} text-zinc-600`}
                aria-hidden
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
                aria-hidden
              >
                <StarSolidIcon
                  className={`${iconClass} ${profileReviewStarTextClass}`}
                  aria-hidden
                />
              </span>
            </span>
          );
        }

        return (
          <StarOutlineIcon
            key={starKey}
            className={`${iconClass} shrink-0 text-zinc-600`}
            aria-hidden
          />
        );
      })}
    </div>
  );
};
