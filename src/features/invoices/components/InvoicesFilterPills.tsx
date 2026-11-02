'use client';

import { FilterMenu } from '@/components/shared';
import React from 'react';

import type { InvoiceListFilterId } from '../types';

const FILTERS: { id: InvoiceListFilterId; label: string }[] = [
  { id: 'all', label: 'All invoices' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
];

export const InvoicesFilters: React.FC<{
  value: InvoiceListFilterId;
  onChange: (id: InvoiceListFilterId) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="mb-4 flex justify-end">
      <FilterMenu
        options={FILTERS}
        value={value}
        onChange={onChange}
        menuLabel="Invoices"
      />
    </div>
  );
};
