'use client';

import { FilterPills, type FilterPillOption } from '@/components/shared';
import React from 'react';

import type { InvoiceListFilterId } from '../types';

const FILTERS: FilterPillOption<InvoiceListFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
];

interface InvoicesFilterPillsProps {
  value: InvoiceListFilterId;
  onChange: (id: InvoiceListFilterId) => void;
}

export const InvoicesFilterPills: React.FC<InvoicesFilterPillsProps> = ({
  value,
  onChange,
}) => {
  return (
    <FilterPills
      options={FILTERS}
      value={value}
      onChange={onChange}
      ariaLabel="Filter invoices"
    />
  );
};
