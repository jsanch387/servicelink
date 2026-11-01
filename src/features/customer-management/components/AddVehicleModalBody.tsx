'use client';

import { Button, Input } from '@/components/shared';
import { createCustomerVehicle } from '@/features/customer-management/api/createCustomerVehicle';
import { parseManualVehicleFields } from '@/features/customer-management/utils/customerAssetTypes';
import type { CustomerVehicle } from '@/features/customer-management/utils/mapCustomerVehicleRows';
import React, { useState } from 'react';

interface AddVehicleModalBodyProps {
  customerId: string;
  onClose: () => void;
  onAdded: (vehicle: CustomerVehicle) => void;
}

export const AddVehicleModalBody: React.FC<AddVehicleModalBodyProps> = ({
  customerId,
  onClose,
  onAdded,
}) => {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseManualVehicleFields({ year, make, model });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createCustomerVehicle(customerId, parsed);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdded(result.vehicle);
    onClose();
  };

  return (
    <form
      onSubmit={event => void handleSubmit(event)}
      className="flex min-h-full flex-1 flex-col"
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        <Input
          label="Year"
          value={year}
          onChange={setYear}
          placeholder="2019"
          inputMode="numeric"
          maxLength={4}
          required
          disabled={saving}
          autoComplete="off"
        />
        <Input
          label="Make"
          value={make}
          onChange={setMake}
          placeholder="Toyota"
          required
          disabled={saving}
          autoComplete="off"
          maxLength={40}
        />
        <Input
          label="Model"
          value={model}
          onChange={setModel}
          placeholder="Camry"
          required
          disabled={saving}
          autoComplete="off"
          maxLength={40}
        />
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="inverse"
          loading={saving}
          className="w-full sm:w-auto"
        >
          Add vehicle
        </Button>
      </div>
    </form>
  );
};
