'use client';

import { Button } from '@/components/shared';
import React from 'react';
import type { DashboardQuote } from '../types';

interface DeleteQuoteModalBodyProps {
  quote: DashboardQuote;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteQuoteModalBody: React.FC<DeleteQuoteModalBodyProps> = ({
  quote,
  isDeleting,
  error,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-200">
        Are you sure you want to delete the quote for{' '}
        <span className="font-semibold">{quote.customerName}</span>?
      </p>
      <p className="text-xs text-gray-500">
        This permanently removes the quote from your dashboard. The customer
        link will stop working. This cannot be undone.
      </p>

      {error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isDeleting}
          className="sm:order-2"
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete quote'}
        </Button>
      </div>
    </div>
  );
};
