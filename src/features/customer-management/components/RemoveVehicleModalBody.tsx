'use client';

import { Button } from '@/components/shared';
import React from 'react';

interface RemoveVehicleModalBodyProps {
  label: string;
  isRemoving: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const RemoveVehicleModalBody: React.FC<RemoveVehicleModalBodyProps> = ({
  label,
  isRemoving,
  error,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-200">
        Remove <span className="font-semibold">{label}</span> from this
        customer?
      </p>
      {error ? (
        <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isRemoving}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isRemoving}>
          Remove
        </Button>
      </div>
    </div>
  );
};
