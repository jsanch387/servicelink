'use client';

import { FilterMenu } from '@/components/shared';
import React from 'react';
import type { ReviewsDashboardFilterId } from '../../types';

const FILTERS: { id: ReviewsDashboardFilterId; label: string }[] = [
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
    <FilterMenu
      options={FILTERS}
      value={value}
      onChange={onChange}
      label="Filter"
      menuLabel="Filter reviews"
    />
  );
};
