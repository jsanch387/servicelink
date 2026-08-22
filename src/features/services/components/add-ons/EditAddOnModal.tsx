'use client';

import {
  Button,
  Input,
  Modal,
  PriceInput,
  TextArea,
  TimeSelect,
} from '@/components/shared';
import {
  addOnDurationPickerValue,
  isValidOptionalAddOnDurationInput,
  parseOptionalAddOnDurationForSave,
} from '@/features/services/utils/addOnDurationForm';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ADD_ON_DESCRIPTION_MAX_LENGTH,
  type AddOnRow,
  type EditAddOnFormData,
} from './addOnTypes';

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
  description: string;
  price: string;
  durationHHmm: string;
} {
  const price =
    addOn.price_cents != null && addOn.price_cents > 0
      ? (addOn.price_cents / 100).toFixed(2)
      : '';
  return {
    name: addOn.name ?? '',
    description: addOn.description ?? '',
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
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !addOn;
  const isOpen = !!addOn || showAddForm;

  useEffect(() => {
    if (addOn) {
      const form = addOnToForm(addOn);
      setName(form.name);
      setDescription(form.description);
      setPrice(form.price);
      setDurationHHmm(form.durationHHmm);
      setError(null);
    } else if (showAddForm) {
      setName('');
      setDescription('');
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
      const descriptionTrim = description.trim();
      const data: EditAddOnFormData = {
        name: nameTrim,
        description: descriptionTrim || null,
        price_cents: Math.round(priceNum * 100),
        duration_minutes: durationResult.duration_minutes,
      };
      onSave(addOn?.id, data);
    },
    [addOn, name, description, price, durationHHmm, onSave]
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
          placeholder="e.g. Extra time, Rush appointment"
          value={name}
          onChange={setName}
          required
        />

        <TextArea
          label="Description (optional)"
          placeholder="Tell customers what this add-on includes."
          value={description}
          onChange={setDescription}
          rows={3}
          maxLength={ADD_ON_DESCRIPTION_MAX_LENGTH}
          inputClassName="resize-y min-h-[5rem]"
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
              Duration (optional)
            </span>
            {durationHHmm.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setDurationHHmm('')}
                className="text-xs font-medium text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <TimeSelect
            variant="duration"
            value={durationHHmm}
            onChange={setDurationHHmm}
            durationPlaceholder="No duration"
            aria-label="Optional add-on duration"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="w-full sm:flex-1 sm:basis-0"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="inverse"
            loading={isSaving}
            disabled={!isValid || isSaving}
            className="w-full sm:flex-1 sm:basis-0"
          >
            {isSaving
              ? isAddMode
                ? 'Adding'
                : 'Saving'
              : isAddMode
                ? 'Add'
                : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
