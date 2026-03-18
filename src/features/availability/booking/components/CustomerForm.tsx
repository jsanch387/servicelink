'use client';

import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import React from 'react';
import type { CustomerFormData } from '../types';

interface CustomerFormProps {
  value: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  onSubmit: () => void;
  /** When true, show vehicle fields (year/make/model). */
  showVehicleFields?: boolean;
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

export function isCustomerFormValid(
  data: CustomerFormData,
  requireVehicleFields = false
): boolean {
  const baseValid = REQUIRED_KEYS.every(
    k => typeof data[k] === 'string' && (data[k] as string).trim().length > 0
  );
  if (!baseValid) return false;
  if (!requireVehicleFields) return true;
  return (
    !!data.vehicleYear.trim() &&
    !!data.vehicleMake.trim() &&
    !!data.vehicleModel.trim()
  );
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  value,
  onChange,
  onSubmit,
  showVehicleFields = false,
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
    if (showVehicleFields) {
      if (!value.vehicleYear.trim())
        next.vehicleYear = 'Vehicle year is required';
      if (!value.vehicleMake.trim())
        next.vehicleMake = 'Vehicle make is required';
      if (!value.vehicleModel.trim())
        next.vehicleModel = 'Vehicle model is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit();
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
          Your details
        </h2>
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
          <div className="sm:max-w-xs">
            <PhoneInput
              label="Phone"
              value={value.phone}
              onChange={v => update({ phone: v })}
              placeholder="(555) 123-4567"
              error={errors.phone}
              required
              showDigitHint
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
          Service address
        </h2>
        <div className="space-y-3 border-t border-white/10 pt-3">
          <Input
            label="Street Address"
            value={value.streetAddress}
            onChange={v => update({ streetAddress: v })}
            placeholder="123 Main St"
            error={errors.streetAddress}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4">
            <Input
              label="Unit / Apt (optional)"
              value={value.unitApt}
              onChange={v => update({ unitApt: v })}
              placeholder="Apt 4B"
            />
            <Input
              label="City"
              value={value.city}
              onChange={v => update({ city: v })}
              placeholder="City"
              error={errors.city}
              required
            />
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
              <Input
                label="State"
                value={value.state}
                onChange={v => update({ state: v.toUpperCase().slice(0, 2) })}
                placeholder="ST"
                error={errors.state}
                required
                maxLength={2}
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
          </div>
        </div>
      </div>

      {/* Vehicle (required when shown) */}
      {showVehicleFields && (
        <div className="space-y-3 pt-4">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Vehicle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-3">
            <Input
              label="Year"
              value={value.vehicleYear}
              onChange={v => update({ vehicleYear: v })}
              placeholder="2018"
              required
            />
            <Input
              label="Make"
              value={value.vehicleMake}
              onChange={v => update({ vehicleMake: v })}
              placeholder="Toyota"
              required
            />
            <Input
              label="Model"
              value={value.vehicleModel}
              onChange={v => update({ vehicleModel: v })}
              placeholder="Camry"
              required
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <TextArea
          label="Notes (optional)"
          value={value.notes}
          onChange={v => update({ notes: v })}
          placeholder="Any special requests or access instructions…"
          rows={3}
        />
      </div>

      {!hideSubmitButton && (
        <div className="pt-2">
          <Button
            type="submit"
            variant="inverse"
            fullWidth
            className="font-semibold"
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
};
