import { Input } from '@/components/shared';
import { CUSTOMER_STATUS_FILTERS } from '@/features/customer-management/constants/customerFilters';
import type { CustomerLifecycle } from '@/features/customer-management/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';

type StatusFilterValue = 'all' | CustomerLifecycle;

interface CustomerSearchAndFiltersProps {
  query: string;
  onQueryChange: (_value: string) => void;
  statusFilter: StatusFilterValue;
  onStatusFilterChange: (_value: StatusFilterValue) => void;
}

export const CustomerSearchAndFilters: React.FC<
  CustomerSearchAndFiltersProps
> = ({ query, onQueryChange, statusFilter, onStatusFilterChange }) => {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="flex flex-col gap-3">
        <Input
          value={query}
          onChange={onQueryChange}
          placeholder="Search by name, service, phone, email..."
          className="w-full"
          leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          inputMode="search"
        />
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_STATUS_FILTERS.map(filter => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onStatusFilterChange(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
