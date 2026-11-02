'use client';

import {
  Button,
  IconButton,
  Input,
  Modal,
  PriceInput,
  Select,
  TextArea,
  TimeSelect,
} from '@/components/shared';
import type { ServiceCategoryRow } from '@/features/services/components/categories/categoryTypes';
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
import { ServiceSpanishCopyFields } from './ServiceSpanishCopyFields';

export interface EditServiceModalProps {
  service: ServiceRow | null;
  /** When true and service is null, show empty form for adding a new service. */
  showAddForm?: boolean;
  /** Server/save error to show above the form (e.g. service unavailable). */
  saveError?: string | null;
  /** Available categories for assignment (add flow). */
  categories?: ServiceCategoryRow[];
  /** Initial category when editing or adding. */
  initialCategoryId?: string | null;
  onClose: () => void;
  /** For edit: serviceId is set. For add: serviceId is undefined. */

  onSave: (serviceId: string | undefined, data: EditServiceFormData) => void;
  isSaving?: boolean;
}

export interface EditServiceFormData {
  name: string;
  description: string;
  name_es: string;
  description_es: string;
  price_cents: number | null;
  duration_minutes: number | null;
  category_id: string | null;
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
  categories = [],
  initialCategoryId = null,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spanishName, setSpanishName] = useState('');
  const [spanishDescription, setSpanishDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !service;
  const isOpen = !!service || showAddForm;

  useEffect(() => {
    if (service) {
      const form = serviceToForm(service);
      setName(form.name);
      setDescription(form.description);
      setSpanishName(service.name_es ?? '');
      setSpanishDescription(service.description_es ?? '');
      setPrice(form.price);
      setDurationHHmm(form.durationHHmm);
      setCategoryId(initialCategoryId ?? '');
      setError(null);
    } else if (showAddForm) {
      setName('');
      setDescription('');
      setSpanishName('');
      setSpanishDescription('');
      setPrice('');
      setDurationHHmm('');
      setCategoryId(initialCategoryId ?? '');
      setError(null);
    }
  }, [service, showAddForm, initialCategoryId]);

  const categoryOptions = [
    { value: '__none__', label: 'No category' },
    ...categories.map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];

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
        name_es: spanishName.trim(),
        description_es: spanishDescription.trim(),
        price_cents: Math.round(priceNum * 100),
        duration_minutes: durationResult.durationMinutes,
        category_id: categoryId || null,
      };
      if (service) {
        onSave(service.id, data);
      } else {
        onSave(undefined, data);
      }
    },
    [
      service,
      name,
      description,
      spanishName,
      spanishDescription,
      price,
      durationHHmm,
      categoryId,
      onSave,
    ]
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
          placeholder="e.g. Standard service, Premium package"
          value={name}
          onChange={setName}
          required
        />

        {isAddMode && categories.length > 0 ? (
          <Select
            label="Category"
            value={categoryId || '__none__'}
            onChange={value => setCategoryId(value === '__none__' ? '' : value)}
            options={categoryOptions}
            placeholder="No category"
          />
        ) : null}

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
          inputClassName="resize-y min-h-[4.5rem]"
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

        <ServiceSpanishCopyFields
          name={spanishName}
          description={spanishDescription}
          onNameChange={setSpanishName}
          onDescriptionChange={setSpanishDescription}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="inverse"
            loading={isSaving}
            disabled={!isValid || isSaving}
            className="flex-1"
          >
            {isSaving
              ? isAddMode
                ? 'Adding'
                : 'Saving'
              : isAddMode
                ? 'Add service'
                : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
