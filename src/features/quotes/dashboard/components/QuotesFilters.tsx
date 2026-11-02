'use client';

import { FilterMenu } from '@/components/shared';
import React from 'react';
import type { QuotesDashboardFilterId } from '../types';

const FILTERS: { id: QuotesDashboardFilterId; label: string }[] = [
  { id: 'all', label: 'All quotes' },
  { id: 'requested', label: 'Requested' },
  { id: 'awaiting_reply', label: 'Awaiting reply' },
  { id: 'approved', label: 'Approved' },
];

export const QuotesFilters: React.FC<{
  value: QuotesDashboardFilterId;
  onChange: (id: QuotesDashboardFilterId) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="mb-4 flex justify-end">
      <FilterMenu
        options={FILTERS}
        value={value}
        onChange={onChange}
        menuLabel="Quotes"
      />
    </div>
  );
};
