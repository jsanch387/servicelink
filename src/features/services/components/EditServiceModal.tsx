'use client';

import {
  Input,
  Modal,
  PriceInput,
  Select,
  SERVICE_DURATION_HOURS_OPTIONS,
  TextArea,
} from '@/components/shared';
import type { ServiceRow } from '@/features/services/types/services';
import React, { useCallback, useEffect, useState } from 'react';

const DURATION_OPTIONS = [
  { value: '', label: 'Select duration' },
  ...SERVICE_DURATION_HOURS_OPTIONS,
];

const MAX_DESCRIPTION_LENGTH = 280;

export interface EditServiceModalProps {
  service: ServiceRow | null;
  /** When true and service is null, show empty form for adding a new service. */
  showAddForm?: boolean;
  /** Server/save error to show above the form (e.g. service unavailable). */
  saveError?: string | null;
  onClose: () => void;
  /** For edit: serviceId is set. For add: serviceId is undefined. */
  // eslint-disable-next-line no-unused-vars -- callback type; params used by caller
  onSave: (serviceId: string | undefined, data: EditServiceFormData) => void;
  isSaving?: boolean;
}

export interface EditServiceFormData {
  name: string;
  description: string;
  price_cents: number | null;
  duration_minutes: number | null;
}

function serviceToForm(service: ServiceRow): {
  name: string;
  description: string;
  price: string;
  durationHours: string;
} {
  const price =
    service.price_cents != null && service.price_cents > 0
      ? (service.price_cents / 100).toFixed(2)
      : '';
  const durationMinutes =
    service.duration_minutes ??
    (service.hours_to_complete != null
      ? Math.round(service.hours_to_complete * 60)
      : null);
  const hoursForSelect =
    durationMinutes != null && durationMinutes > 0
      ? Math.min(10, Math.max(1, Math.round(durationMinutes / 60)))
      : null;
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    price,
    durationHours: hoursForSelect != null ? String(hoursForSelect) : '',
  };
}

export const EditServiceModal: React.FC<EditServiceModalProps> = ({
  service,
  showAddForm = false,
  saveError = null,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !service;
  const isOpen = !!service || showAddForm;

  useEffect(() => {
    if (service) {
      const form = serviceToForm(service);
      setName(form.name);
      setDescription(form.description);
      setPrice(form.price);
      setDurationHours(form.durationHours);
      setError(null);
    } else if (showAddForm) {
      setName('');
      setDescription('');
      setPrice('');
      setDurationHours('');
      setError(null);
    }
  }, [service, showAddForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const nameTrim = name.trim();
      if (!nameTrim) {
        setError('Service name is required.');
        return;
      }
      const descriptionTrim = description.trim();
      if (!descriptionTrim) {
        setError('Description is required.');
        return;
      }
      const priceNum = price.trim() ? parseFloat(price.replace(/,/g, '')) : NaN;
      if (!price.trim() || isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price.');
        return;
      }
      const hours = durationHours ? parseInt(durationHours, 10) : null;
      if (!hours || hours < 1 || hours > 10) {
        setError('Please select a duration (1–10 hours).');
        return;
      }

      setError(null);
      const data: EditServiceFormData = {
        name: nameTrim,
        description: descriptionTrim,
        price_cents: Math.round(priceNum * 100),
        duration_minutes: hours * 60,
      };
      if (service) {
        onSave(service.id, data);
      } else {
        onSave(undefined, data);
      }
    },
    [service, name, description, price, durationHours, onSave]
  );

  if (!isOpen) return null;

  const isValid =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(parseFloat(price.replace(/,/g, ''))) &&
    parseFloat(price.replace(/,/g, '')) >= 0 &&
    durationHours &&
    parseInt(durationHours, 10) >= 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddMode ? 'Add service' : 'Edit service'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || saveError) && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {saveError ?? error}
          </p>
        )}

        <Input
          label="Service name"
          placeholder="e.g., House Cleaning, Logo Design"
          value={name}
          onChange={setName}
          required
        />

        <div className="space-y-2">
          <TextArea
            label="Description (Required)"
            placeholder="Tell customers what they get. Keep it simple."
            value={description}
            onChange={setDescription}
            rows={3}
            required
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Required</span>
            <span
              className={
                description.length > MAX_DESCRIPTION_LENGTH * 0.9
                  ? 'text-gray-400'
                  : ''
              }
            >
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PriceInput
            label="Price"
            placeholder="0.00"
            value={price}
            onChange={setPrice}
            required
          />
          <Select
            label="Duration"
            placeholder="Select duration"
            value={durationHours}
            onChange={setDurationHours}
            options={DURATION_OPTIONS}
            required
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
                ? 'Add service'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
