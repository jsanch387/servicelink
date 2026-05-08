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
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your customers and booking activity.
        </p>
      </div>
      {onAddCustomer ? (
        <div className="hidden shrink-0 sm:flex sm:justify-end">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="font-semibold"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            onClick={onAddCustomer}
            aria-label="Add a customer"
          >
            Add a customer
          </Button>
        </div>
      ) : null}
    </div>
  );
};
