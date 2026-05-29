import React from 'react';

interface ReviewsDashboardHeaderProps {
  needsReplyCount: number;
}

export const ReviewsDashboardHeader: React.FC<ReviewsDashboardHeaderProps> = ({
  needsReplyCount,
}) => {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Reviews
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Reviews arrive by email after completed visits. Reply here in a few
        taps.
      </p>
      {needsReplyCount > 0 ? (
        <p className="mt-2 text-sm font-medium text-amber-200/90">
          {needsReplyCount === 1
            ? '1 review needs your reply'
            : `${needsReplyCount} reviews need your reply`}
        </p>
      ) : null}
    </header>
  );
};
