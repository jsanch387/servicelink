'use client';

import { Input } from '@/components/shared';
import React from 'react';
import {
  sanitizeCityInput,
  sanitizeStateInput,
  sanitizeZipInput,
} from '../utils/businessLocation';

export interface ProfileLocationFieldsProps {
  city: string;
  state: string;
  zip: string;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  onZipChange: (zip: string) => void;
  errors?: string[];
}

function locationFieldError(errors: string[]): string | undefined {
  return errors.find(
    e =>
      e.includes('Location') ||
      e.includes('ZIP') ||
      e.includes('city and state') ||
      e.includes('shop address') ||
      e.includes('Service area')
  );
}

export function ProfileLocationFields({
  city,
  state,
  zip,
  onCityChange,
  onStateChange,
  onZipChange,
  errors = [],
}: ProfileLocationFieldsProps) {
  const locationError = locationFieldError(errors);
  const zipError = errors.some(e => e.toLowerCase().includes('zip'))
    ? 'Required'
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Input
          label="City"
          placeholder="Austin"
          value={city}
          onChange={value => onCityChange(sanitizeCityInput(value))}
          required
          error={locationError}
        />
      </div>
      <div className="sm:col-span-1">
        <Input
          label="State"
          placeholder="TX"
          value={state}
          onChange={value => onStateChange(sanitizeStateInput(value))}
          maxLength={2}
          inputMode="text"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="ZIP"
          placeholder="78701"
          value={zip}
          onChange={value => onZipChange(sanitizeZipInput(value))}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          required
          error={zipError}
        />
      </div>
    </div>
  );
}
