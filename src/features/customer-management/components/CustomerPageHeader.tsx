import { Button } from '@/components/shared';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CustomerPageHeaderProps {
  /** Opens add-customer flow; shown from `sm` up (mobile uses sticky bar). */
  onAddCustomer?: () => void;
}

export const CustomerPageHeader: React.FC<CustomerPageHeaderProps> = ({
  onAddCustomer,
}) => {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold leading-none text-white">
          Customers
        </h1>
        <p className="mt-1 text-gray-400">
          Manage your customers and booking activity.
        </p>
      </div>
      {onAddCustomer ? (
        <Button
          type="button"
          variant="inverse"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" aria-hidden />}
          className="w-full shrink-0 sm:w-auto"
          onClick={onAddCustomer}
          aria-label="Add a customer"
        >
          Add a customer
        </Button>
      ) : null}
    </header>
  );
};
