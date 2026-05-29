'use client';

import { FilterPills, type FilterPillOption } from '@/components/shared';
import React from 'react';
import type { ReviewsDashboardFilterId } from '../../types';

const FILTERS: FilterPillOption<ReviewsDashboardFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'needs_reply', label: 'Needs reply' },
  { id: 'replied', label: 'Replied' },
];

interface ReviewsFilterPillsProps {
  value: ReviewsDashboardFilterId;
  onChange: (id: ReviewsDashboardFilterId) => void;
}

export const ReviewsFilterPills: React.FC<ReviewsFilterPillsProps> = ({
  value,
  onChange,
}) => {
  return (
    <FilterPills
      options={FILTERS}
      value={value}
      onChange={onChange}
      ariaLabel="Filter reviews"
      compactOnMobile
    />
  );
};
