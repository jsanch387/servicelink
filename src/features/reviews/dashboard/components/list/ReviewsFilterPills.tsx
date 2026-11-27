'use client';

import { FilterPills, type FilterPillOption } from '@/components/shared';
import React, { useMemo } from 'react';
import type { ReviewsDashboardFilterId } from '../../types';

interface ReviewsFilterPillsProps {
  value: ReviewsDashboardFilterId;
  onChange: (id: ReviewsDashboardFilterId) => void;
  allCount: number;
  needsReplyCount: number;
}

export const ReviewsFilterPills: React.FC<ReviewsFilterPillsProps> = ({
  value,
  onChange,
  allCount,
  needsReplyCount,
}) => {
  const options = useMemo<FilterPillOption<ReviewsDashboardFilterId>[]>(
    () => [
      { id: 'all', label: `All (${allCount})` },
      { id: 'needs_reply', label: `Needs reply (${needsReplyCount})` },
    ],
    [allCount, needsReplyCount]
  );

  return (
    <FilterPills
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="Filter reviews"
      size="sm"
    />
  );
};
