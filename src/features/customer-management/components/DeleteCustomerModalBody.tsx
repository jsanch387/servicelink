'use client';

import { Button } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import React from 'react';

interface DeleteCustomerModalBodyProps {
  customer: CustomerRecord;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteCustomerModalBody: React.FC<
  DeleteCustomerModalBodyProps
> = ({ customer, isDeleting, error, onConfirm, onClose }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-200">
        Delete <span className="font-semibold">{customer.name}</span> from your
        customer list?
      </p>
      <p className="text-xs text-gray-500">
        This can’t be undone. Related data may also be affected depending on
        your database configuration.
      </p>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isDeleting}
          className="sm:order-2"
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete customer'}
        </Button>
      </div>
    </div>
  );
};
