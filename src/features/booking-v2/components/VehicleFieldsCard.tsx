'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { BookingV2Vehicle } from '../types';

export function VehicleFieldsCard({
  value,
  onChange,
  bookingFlowLocale,
}: {
  value: BookingV2Vehicle;
  onChange: (next: BookingV2Vehicle) => void;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;

  return (
    <section>
      <h2 className="mb-2.5 text-[17px] font-bold leading-5 text-white">
        {ui.yourVehicle}
      </h2>
      <div className="grid grid-cols-[1fr_1.6fr_1.6fr] overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
        <VehicleField
          label={ui.year}
          value={value.year}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          onChange={year => onChange({ ...value, year })}
        />
        <VehicleField
          label={ui.make}
          value={value.make}
          autoComplete="off"
          divided
          onChange={make => onChange({ ...value, make })}
        />
        <VehicleField
          label={ui.model}
          value={value.model}
          autoComplete="off"
          divided
          onChange={model => onChange({ ...value, model })}
        />
      </div>
    </section>
  );
}

function VehicleField({
  label,
  value,
  onChange,
  divided = false,
  inputMode,
  maxLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  divided?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label
      className={`block px-4 py-2.5 ${divided ? 'border-l border-[#262626]' : ''}`}
    >
      <span className="block text-[13px] font-medium text-[#A3A3A3]">
        {label}
      </span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-label={label}
        className="mt-0.5 w-full border-0 bg-transparent p-0 text-[16px] text-white outline-none"
      />
    </label>
  );
}
