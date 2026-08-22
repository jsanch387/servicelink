'use client';

import { Input, Select } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  PET_SIZE_VALUES,
  PET_SPECIES_VALUES,
} from '@/features/customer-management/utils/customerAssetTypes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import {
  BOOKING_PET_BREED_MAX,
  BOOKING_PET_NAME_MAX,
} from '../utils/bookingCustomerFieldLimits';

export interface BookingPetFieldValues {
  petName: string;
  petSpecies: string;
  petBreed: string;
  petSize: string;
}

export interface BookingPetFieldErrors {
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petSize?: string;
}

interface BookingPetFieldsProps {
  value: BookingPetFieldValues;
  onChange: (updates: Partial<BookingPetFieldValues>) => void;
  errors?: BookingPetFieldErrors;
  bookingFlowLocale?: PublicBookingFlowLocale;
  required?: boolean;
  onBlurField?: (field: keyof BookingPetFieldValues) => void;
}

export function BookingPetFields({
  value,
  onChange,
  errors = {},
  bookingFlowLocale = 'en',
  required = true,
  onBlurField,
}: BookingPetFieldsProps) {
  const cf = publicBookingUi(bookingFlowLocale).customerForm;

  const speciesOptions = PET_SPECIES_VALUES.map(species => ({
    value: species,
    label: species === 'Dog' ? cf.speciesDog : cf.speciesCat,
  }));
  const sizeOptions = PET_SIZE_VALUES.map(size => ({
    value: size,
    label:
      size === 'Small'
        ? cf.sizeSmall
        : size === 'Medium'
          ? cf.sizeMedium
          : size === 'Large'
            ? cf.sizeLarge
            : cf.sizeXl,
  }));

  return (
    <div className="space-y-4">
      <Input
        label={cf.petName}
        value={value.petName}
        onChange={v => onChange({ petName: v.slice(0, BOOKING_PET_NAME_MAX) })}
        onBlur={onBlurField ? () => onBlurField('petName') : undefined}
        placeholder={cf.petNamePlaceholder}
        error={errors.petName}
        required={required}
        maxLength={BOOKING_PET_NAME_MAX}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={cf.petSpecies}
          value={value.petSpecies}
          onChange={v => onChange({ petSpecies: v })}
          options={speciesOptions}
          placeholder={cf.petSpeciesPlaceholder}
          error={errors.petSpecies}
          required={required}
        />
        <Select
          label={cf.petSize}
          value={value.petSize}
          onChange={v => onChange({ petSize: v })}
          options={sizeOptions}
          placeholder={cf.petSizePlaceholder}
          error={errors.petSize}
          required={required}
        />
      </div>
      <Input
        label={cf.petBreed}
        value={value.petBreed}
        onChange={v =>
          onChange({ petBreed: v.slice(0, BOOKING_PET_BREED_MAX) })
        }
        onBlur={onBlurField ? () => onBlurField('petBreed') : undefined}
        placeholder={cf.petBreedPlaceholder}
        error={errors.petBreed}
        required={required}
        maxLength={BOOKING_PET_BREED_MAX}
      />
    </div>
  );
}
