'use client';

import { Button } from '@/components/shared';
import { ReceiptPercentIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const ExpensesEmptyState: React.FC<{
  title: string;
  description: string;
  canCreate: boolean;
  onAdd: () => void;
}> = ({ title, description, canCreate, onAdd }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <ReceiptPercentIcon className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <p className="mb-6 max-w-md text-sm text-gray-400">{description}</p>
      {canCreate ? (
        <Button type="button" variant="primary" size="md" onClick={onAdd}>
          Add expense
        </Button>
      ) : null}
    </div>
  );
};
