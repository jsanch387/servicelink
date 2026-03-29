'use client';

import { Input, Modal, PriceInput } from '@/components/shared';
import { TimeSelect } from '@/features/availability/components/TimeSelect';
import {
  addOnDurationPickerValue,
  isValidOptionalAddOnDurationInput,
  parseOptionalAddOnDurationForSave,
} from '@/features/services/utils/addOnDurationForm';
import React, { useCallback, useEffect, useState } from 'react';
import type { AddOnRow, EditAddOnFormData } from './addOnTypes';

export interface EditAddOnModalProps {
  addOn: AddOnRow | null;
  /** When true and addOn is null, show empty form for adding a new add-on. */
  showAddForm?: boolean;
  saveError?: string | null;
  onClose: () => void;

  onSave: (addOnId: string | undefined, data: EditAddOnFormData) => void;
  isSaving?: boolean;
}

function addOnToForm(addOn: AddOnRow): {
  name: string;
  price: string;
  durationHHmm: string;
} {
  const price =
    addOn.price_cents != null && addOn.price_cents > 0
      ? (addOn.price_cents / 100).toFixed(2)
      : '';
  return {
    name: addOn.name ?? '',
    price,
    durationHHmm: addOnDurationPickerValue(addOn.duration_minutes),
  };
}

export const EditAddOnModal: React.FC<EditAddOnModalProps> = ({
  addOn,
  showAddForm = false,
  saveError = null,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !addOn;
  const isOpen = !!addOn || showAddForm;

  useEffect(() => {
    if (addOn) {
      const form = addOnToForm(addOn);
      setName(form.name);
      setPrice(form.price);
      setDurationHHmm(form.durationHHmm);
      setError(null);
    } else if (showAddForm) {
      setName('');
      setPrice('');
      setDurationHHmm('');
      setError(null);
    }
  }, [addOn, showAddForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const nameTrim = name.trim();
      if (!nameTrim) {
        setError('Add-on name is required.');
        return;
      }
      const priceNum = price.trim() ? parseFloat(price.replace(/,/g, '')) : NaN;
      if (!price.trim() || isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price.');
        return;
      }

      const durationResult = parseOptionalAddOnDurationForSave(durationHHmm);
      if (!durationResult.ok) {
        setError(durationResult.error);
        return;
      }

      setError(null);
      const data: EditAddOnFormData = {
        name: nameTrim,
        price_cents: Math.round(priceNum * 100),
        duration_minutes: durationResult.duration_minutes,
      };
      onSave(addOn?.id, data);
    },
    [addOn, name, price, durationHHmm, onSave]
  );

  if (!isOpen) return null;

  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(parseFloat(price.replace(/,/g, ''))) &&
    parseFloat(price.replace(/,/g, '')) >= 0 &&
    isValidOptionalAddOnDurationInput(durationHHmm);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddMode ? 'Add add-on' : 'Edit add-on'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || saveError) && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {saveError ?? error}
          </p>
        )}

        <Input
          label="Add-on name"
          placeholder="e.g., Extra polish, Rush delivery"
          value={name}
          onChange={setName}
          required
        />

        <PriceInput
          label="Price"
          placeholder="0.00"
          value={price}
          onChange={setPrice}
          required
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="block text-sm font-medium text-gray-300">
              Extra time (optional)
            </span>
            {durationHHmm.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setDurationHHmm('')}
                className="text-xs font-medium text-gray-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <TimeSelect
            variant="duration"
            value={durationHHmm}
            onChange={setDurationHHmm}
            durationPlaceholder="No extra time"
            aria-label="Optional add-on duration"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSaving}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 text-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? isAddMode
                ? 'Adding…'
                : 'Saving…'
              : isAddMode
                ? 'Add add-on'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
