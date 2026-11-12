'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  BOOKING_PET_BREED_MAX,
  BOOKING_PET_NAME_MAX,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import {
  PET_SIZE_VALUES,
  PET_SPECIES_VALUES,
} from '@/features/customer-management/utils/customerAssetTypes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { BookingV2Pet } from '../types';

export function PetFieldsCard({
  value,
  onChange,
  bookingFlowLocale,
}: {
  value: BookingV2Pet;
  onChange: (next: BookingV2Pet) => void;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const fields = ui.customerForm;

  const speciesLabel = (species: (typeof PET_SPECIES_VALUES)[number]) =>
    species === 'Dog' ? fields.speciesDog : fields.speciesCat;
  const sizeLabel = (size: (typeof PET_SIZE_VALUES)[number]) =>
    size === 'Small'
      ? fields.sizeSmall
      : size === 'Medium'
        ? fields.sizeMedium
        : size === 'Large'
          ? fields.sizeLarge
          : fields.sizeXl;

  return (
    <section>
      <h2 className="mb-2.5 text-[17px] font-bold leading-5 text-white">
        {ui.bookingV2.yourPet}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
        <PetTextField
          label={fields.petName}
          value={value.name}
          maxLength={BOOKING_PET_NAME_MAX}
          onChange={name => onChange({ ...value, name })}
        />
        <div className="grid grid-cols-2 border-t border-[#262626]">
          <PetSelectField
            label={fields.petSpecies}
            value={value.species}
            placeholder={fields.petSpeciesPlaceholder}
            options={PET_SPECIES_VALUES.map(species => ({
              value: species,
              label: speciesLabel(species),
            }))}
            onChange={species => onChange({ ...value, species })}
          />
          <PetSelectField
            label={fields.petSize}
            value={value.size}
            placeholder={fields.petSizePlaceholder}
            divided
            options={PET_SIZE_VALUES.map(size => ({
              value: size,
              label: sizeLabel(size),
            }))}
            onChange={size => onChange({ ...value, size })}
          />
        </div>
        <PetTextField
          label={fields.petBreed}
          value={value.breed}
          maxLength={BOOKING_PET_BREED_MAX}
          divided
          onChange={breed => onChange({ ...value, breed })}
        />
      </div>
    </section>
  );
}

function PetTextField({
  label,
  value,
  onChange,
  maxLength,
  divided = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  divided?: boolean;
}) {
  return (
    <label
      className={`block px-4 py-2.5 ${divided ? 'border-t border-[#262626]' : ''}`}
    >
      <span className="block text-[13px] font-medium text-[#A3A3A3]">
        {label}
      </span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        maxLength={maxLength}
        autoComplete="off"
        aria-label={label}
        className="mt-0.5 w-full border-0 bg-transparent p-0 text-[16px] text-white outline-none"
      />
    </label>
  );
}

function PetSelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  divided = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
  divided?: boolean;
}) {
  return (
    <label
      className={`block px-4 py-2.5 ${divided ? 'border-l border-[#262626]' : ''}`}
    >
      <span className="block text-[13px] font-medium text-[#A3A3A3]">
        {label}
      </span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-label={label}
        className="mt-0.5 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-[16px] text-white outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
