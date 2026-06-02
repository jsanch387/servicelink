'use client';

import { profileReviewStarTextClass } from '@/features/business-profile/reviews/constants/reviewStars';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const STAR_SIZE = 'h-11 w-11 sm:h-12 sm:w-12';

export type PublicReviewStarInputProps = {
  rating: number | null;
  hoverRating: number | null;
  onSelect: (value: number) => void;
  onHover: (value: number | null) => void;
};

export function PublicReviewStarInput({
  rating,
  hoverRating,
  onSelect,
  onHover,
}: PublicReviewStarInputProps) {
  const displayRating = hoverRating ?? rating;

  return (
    <div
      className="flex justify-center gap-1.5 sm:gap-2"
      role="radiogroup"
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map(value => {
        const filled = displayRating !== null && value <= displayRating;
        return (
          <button
            key={value}
            type="button"
            className="rounded-lg p-1 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg)]"
            onClick={() => onSelect(value)}
            onMouseEnter={() => onHover(value)}
            onMouseLeave={() => onHover(null)}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-checked={rating === value}
            role="radio"
          >
            {filled ? (
              <StarSolidIcon
                className={`${STAR_SIZE} shrink-0 ${profileReviewStarTextClass}`}
                aria-hidden
              />
            ) : (
              <StarOutlineIcon
                className={`${STAR_SIZE} shrink-0 text-zinc-600`}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
