import { FilterPills, type FilterPillOption, Input } from '@/components/shared';
import { CUSTOMER_STATUS_FILTERS } from '@/features/customer-management/constants/customerFilters';
import type { CustomerLifecycle } from '@/features/customer-management/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';

type StatusFilterValue = 'all' | CustomerLifecycle;
type CustomerFilterValue = StatusFilterValue | 'needs_attention';

const CUSTOMER_FILTER_OPTIONS: FilterPillOption<CustomerFilterValue>[] =
  CUSTOMER_STATUS_FILTERS.map(filter => ({
    id: filter.value,
    label: filter.label,
  }));

interface CustomerSearchAndFiltersProps {
  query: string;
  onQueryChange: (_value: string) => void;
  statusFilter: CustomerFilterValue;
  onStatusFilterChange: (_value: CustomerFilterValue) => void;
}

export const CustomerSearchAndFilters: React.FC<
  CustomerSearchAndFiltersProps
> = ({ query, onQueryChange, statusFilter, onStatusFilterChange }) => {
  return (
    <div className="mb-3 sm:mb-5">
      <div className="flex flex-col gap-2 sm:gap-3">
        <Input
          value={query}
          onChange={onQueryChange}
          placeholder="Search by customer name..."
          className="w-full"
          leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          inputMode="search"
        />
        <FilterPills
          options={CUSTOMER_FILTER_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          ariaLabel="Filter customers"
          compactOnMobile
        />
      </div>
    </div>
  );
};
