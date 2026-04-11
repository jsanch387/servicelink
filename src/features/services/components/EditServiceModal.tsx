'use client';

import {
  IconButton,
  Input,
  Modal,
  PriceInput,
  TextArea,
} from '@/components/shared';
import { TimeSelect } from '@/features/availability/components/TimeSelect';
import {
  SERVICE_DESCRIPTION_MAX_LENGTH,
  insertServiceDescriptionBullet,
} from '@/features/business-profile/utils/serviceDescriptionDisplay';
import type { ServiceRow } from '@/features/services/types/services';
import {
  isValidServiceEditDurationInput,
  parseServiceEditDurationForSave,
  serviceEditDurationPickerValue,
} from '@/features/services/utils/serviceEditForm';
import { ListBulletIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface EditServiceModalProps {
  service: ServiceRow | null;
  /** When true and service is null, show empty form for adding a new service. */
  showAddForm?: boolean;
  /** Server/save error to show above the form (e.g. service unavailable). */
  saveError?: string | null;
  onClose: () => void;
  /** For edit: serviceId is set. For add: serviceId is undefined. */

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
  durationHHmm: string;
} {
  const price =
    service.price_cents != null && service.price_cents > 0
      ? (service.price_cents / 100).toFixed(2)
      : '';
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    price,
    durationHHmm: serviceEditDurationPickerValue(service),
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
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !service;
  const isOpen = !!service || showAddForm;

  useEffect(() => {
    if (service) {
      const form = serviceToForm(service);
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
  }, [service, showAddForm]);

  const handleInsertDescriptionBullet = useCallback(() => {
    const el = descriptionTextareaRef.current;
    const start = el?.selectionStart ?? description.length;
    const end = el?.selectionEnd ?? description.length;
    const { value: next, caret } = insertServiceDescriptionBullet(
      description,
      start,
      end
    );
    setDescription(next);
    setTimeout(() => {
      const node = descriptionTextareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  }, [description]);

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
      const durationResult = parseServiceEditDurationForSave(durationHHmm);
      if (!durationResult.ok) {
        setError(durationResult.error);
        return;
      }

      setError(null);
      const data: EditServiceFormData = {
        name: nameTrim,
        description: descriptionTrim,
        price_cents: Math.round(priceNum * 100),
        duration_minutes: durationResult.durationMinutes,
      };
      if (service) {
        onSave(service.id, data);
      } else {
        onSave(undefined, data);
      }
    },
    [service, name, description, price, durationHHmm, onSave]
  );

  if (!isOpen) return null;

  const isValid =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(parseFloat(price.replace(/,/g, ''))) &&
    parseFloat(price.replace(/,/g, '')) >= 0 &&
    isValidServiceEditDurationInput(durationHHmm);

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

        <TextArea
          ref={descriptionTextareaRef}
          label="Description (Required)"
          placeholder="Tell customers what they get."
          footerStart={
            <IconButton
              variant="ghost"
              size="sm"
              className="rounded-lg text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 -mr-1"
              title="Insert bullet"
              aria-label="Insert bullet"
              icon={<ListBulletIcon className="h-5 w-5" />}
              onClick={handleInsertDescriptionBullet}
            />
          }
          value={description}
          onChange={setDescription}
          rows={5}
          maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
          inputClassName="resize-y min-h-[7.5rem]"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PriceInput
            label="Price"
            placeholder="0.00"
            value={price}
            onChange={setPrice}
            required
          />
          <div className="min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </span>
            <TimeSelect
              variant="duration"
              value={durationHHmm}
              onChange={setDurationHHmm}
              durationPlaceholder="Select duration"
            />
          </div>
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
