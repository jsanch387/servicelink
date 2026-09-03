'use client';

import { FilterPills, type FilterPillOption } from '@/components/shared';
import type { QuotesDashboardFilterId } from '../types';
import React from 'react';

const FILTERS: FilterPillOption<QuotesDashboardFilterId>[] = [
  { id: 'requested', label: 'Requested' },
  { id: 'awaiting_reply', label: 'Awaiting reply' },
  { id: 'approved', label: 'Approved' },
];

interface QuotesFilterPillsProps {
  value: QuotesDashboardFilterId;
  onChange: (id: QuotesDashboardFilterId) => void;
}

export const QuotesFilterPills: React.FC<QuotesFilterPillsProps> = ({
  value,
  onChange,
}) => {
  return (
    <FilterPills
      options={FILTERS}
      value={value}
      onChange={onChange}
      ariaLabel="Filter quotes"
    />
  );
};
