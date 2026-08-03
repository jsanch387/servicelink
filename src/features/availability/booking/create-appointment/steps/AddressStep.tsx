'use client';

import { GlassCard, Input } from '@/components/shared';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
  sanitizeUsZipInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import React from 'react';
import type { CreateAppointmentAddress } from '../types';

export interface AddressStepProps {
  address: CreateAppointmentAddress;
  onChange: (patch: Partial<CreateAppointmentAddress>) => void;
}

export function AddressStep({ address, onChange }: AddressStepProps) {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <div className="space-y-5">
        <Input
          label="Street address"
          placeholder="123 Main St"
          value={address.street}
          onChange={value =>
            onChange({ street: value.slice(0, BOOKING_CUSTOMER_STREET_MAX) })
          }
          required
          autoComplete="street-address"
        />
        <Input
          label="Unit / apt"
          placeholder="Optional"
          value={address.unit}
          onChange={value =>
            onChange({ unit: value.slice(0, BOOKING_CUSTOMER_UNIT_MAX) })
          }
          required={false}
          autoComplete="address-line2"
        />
        <Input
          label="City"
          placeholder="City"
          value={address.city}
          onChange={value =>
            onChange({ city: value.slice(0, BOOKING_CUSTOMER_CITY_MAX) })
          }
          required
          autoComplete="address-level2"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="State"
            placeholder="TX"
            value={address.state}
            onChange={value =>
              onChange({
                state: value
                  .replace(/[^a-zA-Z]/g, '')
                  .toUpperCase()
                  .slice(0, 2),
              })
            }
            required
            autoComplete="address-level1"
            maxLength={2}
          />
          <Input
            label="ZIP"
            placeholder="78701"
            value={address.zip}
            onChange={value => onChange({ zip: sanitizeUsZipInput(value) })}
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
          />
        </div>
      </div>
    </GlassCard>
  );
}
