import { Button } from '@/components/shared';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CustomersInitialEmptyStateProps {
  onAddCustomer?: () => void;
}

/** No rows in `customers` yet (distinct from search/filter miss). */
export const CustomersInitialEmptyState: React.FC<
  CustomersInitialEmptyStateProps
> = ({ onAddCustomer }) => {
  return (
    <div className="px-2 py-16 text-center">
      <p className="text-sm text-white/60">
        When someone books with you, they&apos;ll show up here.
      </p>
      {onAddCustomer ? (
        <Button
          type="button"
          variant="inverse"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" aria-hidden />}
          className="mt-4 !h-11 !min-h-11 !rounded-full sm:!h-10 sm:!min-h-10 sm:!rounded-[10px]"
          onClick={onAddCustomer}
        >
          Add a customer
        </Button>
      ) : null}
    </div>
  );
};
