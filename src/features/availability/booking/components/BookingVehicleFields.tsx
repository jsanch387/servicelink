'use client';

import { Input } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import {
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
} from '../utils/bookingCustomerFieldLimits';

export interface BookingVehicleFieldValues {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
}

export interface BookingVehicleFieldErrors {
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

interface BookingVehicleFieldsProps {
  value: BookingVehicleFieldValues;
  onChange: (updates: Partial<BookingVehicleFieldValues>) => void;
  errors?: BookingVehicleFieldErrors;
  bookingFlowLocale?: PublicBookingFlowLocale;
  required?: boolean;
  /**
   * `row` — 3 columns from `sm` up (owner / wider forms).
   * `stack` — full-width stacked fields (narrow public membership flows).
   */
  layout?: 'row' | 'stack';
  /** Inline (onBlur) validation hook — called with the field that lost focus. */
  onBlurField?: (field: keyof BookingVehicleFieldValues) => void;
}

export function BookingVehicleFields({
  value,
  onChange,
  errors = {},
  bookingFlowLocale = 'en',
  required = true,
  layout = 'row',
  onBlurField,
}: BookingVehicleFieldsProps) {
  const cf = publicBookingUi(bookingFlowLocale).customerForm;

  return (
    <div
      className={
        layout === 'stack'
          ? 'space-y-4'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-3'
      }
    >
      <Input
        label={cf.year}
        value={value.vehicleYear}
        onChange={v => onChange({ vehicleYear: sanitizeVehicleYearInput(v) })}
        onBlur={onBlurField ? () => onBlurField('vehicleYear') : undefined}
        placeholder="2018"
        error={errors.vehicleYear}
        required={required}
        inputMode="numeric"
        maxLength={4}
      />
      <Input
        label={cf.make}
        value={value.vehicleMake}
        onChange={v =>
          onChange({
            vehicleMake: sanitizeVehicleTextInput(v, BOOKING_VEHICLE_MAKE_MAX),
          })
        }
        onBlur={onBlurField ? () => onBlurField('vehicleMake') : undefined}
        placeholder="Toyota"
        error={errors.vehicleMake}
        required={required}
        maxLength={BOOKING_VEHICLE_MAKE_MAX}
      />
      <Input
        label={cf.model}
        value={value.vehicleModel}
        onChange={v =>
          onChange({
            vehicleModel: sanitizeVehicleTextInput(
              v,
              BOOKING_VEHICLE_MODEL_MAX
            ),
          })
        }
        onBlur={onBlurField ? () => onBlurField('vehicleModel') : undefined}
        placeholder="Camry"
        error={errors.vehicleModel}
        required={required}
        maxLength={BOOKING_VEHICLE_MODEL_MAX}
      />
    </div>
  );
}
