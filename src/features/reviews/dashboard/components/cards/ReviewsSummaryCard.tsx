'use client';

import {
  formatAverageRating,
  PROFILE_REVIEW_STAR_COLOR,
  StarRatingDisplay,
} from '@/features/business-profile/reviews';
import { DashboardGlassCard } from '@/features/dashboard';
import React from 'react';
import type { RatingBreakdownRow } from '../../types';

interface ReviewsSummaryCardProps {
  averageRating: number;
  reviewCount: number;
  breakdown: RatingBreakdownRow[];
}

export const ReviewsSummaryCard: React.FC<ReviewsSummaryCardProps> = ({
  averageRating,
  reviewCount,
  breakdown,
}) => {
  const formattedAverage = formatAverageRating(averageRating);
  const countLabel = reviewCount === 1 ? '1 review' : `${reviewCount} reviews`;

  return (
    <DashboardGlassCard fillGridCell={false} padding="md" className="w-full">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div
          className="flex items-start gap-3 sm:gap-4"
          aria-label={`${formattedAverage} out of 5 stars, ${countLabel}`}
        >
          <p
            className="text-4xl font-black tabular-nums leading-none tracking-tight text-white sm:text-5xl"
            aria-hidden
          >
            {formattedAverage}
          </p>
          <div className="flex flex-col gap-1.5 pt-1.5" aria-hidden>
            <StarRatingDisplay rating={averageRating} size="md" />
            <p className="text-sm text-zinc-500">{countLabel}</p>
          </div>
        </div>

        <div
          className="w-full space-y-2 sm:max-w-[260px] sm:flex-1"
          role="presentation"
          aria-hidden
        >
          {breakdown.map(({ stars, percent }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="w-3 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-500">
                {stars}
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: PROFILE_REVIEW_STAR_COLOR,
                  }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-zinc-600">
                {percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardGlassCard>
  );
};
