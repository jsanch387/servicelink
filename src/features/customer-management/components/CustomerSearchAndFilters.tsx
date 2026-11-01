import {
  Button,
  FilterMenu,
  Input,
  filterMenuTriggerClassName,
} from '@/components/shared';
import { CUSTOMER_STATUS_FILTERS } from '@/features/customer-management/constants/customerFilters';
import type { CustomerLifecycle } from '@/features/customer-management/types';
import {
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

type StatusFilterValue = 'all' | CustomerLifecycle;
type CustomerFilterValue = StatusFilterValue | 'needs_attention';

const CUSTOMER_FILTER_OPTIONS = CUSTOMER_STATUS_FILTERS.map(filter => ({
  id: filter.value,
  label: filter.label,
}));

interface CustomerSearchAndFiltersProps {
  query: string;
  onQueryChange: (_value: string) => void;
  statusFilter: CustomerFilterValue;
  onStatusFilterChange: (_value: CustomerFilterValue) => void;
  onAddCustomer?: () => void;
  onImport?: () => void;
}

export const CustomerSearchAndFilters: React.FC<
  CustomerSearchAndFiltersProps
> = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onAddCustomer,
  onImport,
}) => {
  return (
    <div className="mb-4 flex flex-col gap-x-2 gap-y-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={query}
        onChange={onQueryChange}
        placeholder="Search"
        className="w-full sm:max-w-sm"
        inputClassName="!h-10 !min-h-10 max-sm:!h-11 max-sm:!min-h-11"
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
        inputMode="search"
      />
      <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
        <FilterMenu
          options={CUSTOMER_FILTER_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          menuLabel="Customers"
          tone="solid"
        />
        {onImport ? (
          <button
            type="button"
            onClick={onImport}
            className={filterMenuTriggerClassName('solid')}
          >
            <span>Import</span>
            <ArrowUpTrayIcon
              className="h-4 w-4 shrink-0 text-gray-400"
              aria-hidden
            />
          </button>
        ) : null}
        {onAddCustomer ? (
          <Button
            type="button"
            variant="inverse"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            className="shrink-0"
            onClick={onAddCustomer}
            aria-label="Add a customer"
          >
            Add a customer
          </Button>
        ) : null}
      </div>
    </div>
  );
};
