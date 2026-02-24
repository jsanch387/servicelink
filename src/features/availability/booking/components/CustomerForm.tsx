'use client';

import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import React from 'react';
import type { CustomerFormData } from '../types';

interface CustomerFormProps {
  value: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  onSubmit: () => void;
  /** When true, hide the submit button (parent uses sticky CTA). */
  hideSubmitButton?: boolean;
  submitLabel?: string;
  /** Form id for external submit (e.g. sticky button). */
  id?: string;
}

const REQUIRED_KEYS: (keyof CustomerFormData)[] = [
  'fullName',
  'email',
  'phone',
  'streetAddress',
  'city',
  'state',
  'zip',
];

export function isCustomerFormValid(data: CustomerFormData): boolean {
  return REQUIRED_KEYS.every(
    k => typeof data[k] === 'string' && (data[k] as string).trim().length > 0
  );
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  value,
  onChange,
  onSubmit,
  hideSubmitButton = false,
  submitLabel = 'Review Booking',
  id,
}) => {
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CustomerFormData, string>>
  >({});

  const update = (updates: Partial<CustomerFormData>) => {
    onChange({ ...value, ...updates });
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!value.fullName.trim()) next.fullName = 'Full name is required';
    if (!value.email.trim()) next.email = 'Email is required';
    if (!value.phone.trim()) next.phone = 'Phone is required';
    if (!value.streetAddress.trim())
      next.streetAddress = 'Street address is required';
    if (!value.city.trim()) next.city = 'City is required';
    if (!value.state.trim()) next.state = 'State is required';
    if (!value.zip.trim()) next.zip = 'ZIP is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit();
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        Your details
      </h2>
      <Input
        label="Full Name"
        value={value.fullName}
        onChange={v => update({ fullName: v })}
        placeholder="Jane Doe"
        error={errors.fullName}
        required
      />
      <Input
        label="Email"
        type="email"
        value={value.email}
        onChange={v => update({ email: v })}
        placeholder="jane@example.com"
        error={errors.email}
        required
      />
      <PhoneInput
        label="Phone"
        value={value.phone}
        onChange={v => update({ phone: v })}
        placeholder="(555) 123-4567"
        error={errors.phone}
        required
        showDigitHint
      />

      <h2 className="text-xl font-semibold text-white tracking-tight pt-4">
        Address
      </h2>
      <Input
        label="Street Address"
        value={value.streetAddress}
        onChange={v => update({ streetAddress: v })}
        placeholder="123 Main St"
        error={errors.streetAddress}
        required
      />
      <Input
        label="Unit / Apt (optional)"
        value={value.unitApt}
        onChange={v => update({ unitApt: v })}
        placeholder="Apt 4B"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          value={value.city}
          onChange={v => update({ city: v })}
          placeholder="City"
          error={errors.city}
          required
        />
        <Input
          label="State"
          value={value.state}
          onChange={v => update({ state: v.toUpperCase() })}
          placeholder="State"
          error={errors.state}
          required
        />
        <Input
          label="ZIP"
          value={value.zip}
          onChange={v => update({ zip: v })}
          placeholder="ZIP"
          error={errors.zip}
          required
        />
      </div>

      <TextArea
        label="Notes (optional)"
        value={value.notes}
        onChange={v => update({ notes: v })}
        placeholder="Any special requests..."
        rows={3}
      />

      {!hideSubmitButton && (
        <Button
          type="submit"
          variant="inverse"
          size="lg"
          fullWidth
          className="font-semibold"
        >
          {submitLabel}
        </Button>
      )}
    </form>
  );
};
