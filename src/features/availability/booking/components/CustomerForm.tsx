'use client';

import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { isValidEmail } from '@/features/auth/utils/validation';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
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
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** When true, email is optional and an empty-email hint is shown. */
  emailOptional?: boolean;
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

const REQUIRED_WITHOUT_EMAIL: (keyof CustomerFormData)[] = [
  'fullName',
  'phone',
  'streetAddress',
  'city',
  'state',
  'zip',
];

export function isCustomerFormValid(
  data: CustomerFormData,
  requireVehicleFields = false,
  emailOptional = false
): boolean {
  const keys = emailOptional ? REQUIRED_WITHOUT_EMAIL : REQUIRED_KEYS;
  const baseValid = keys.every(
    k => typeof data[k] === 'string' && (data[k] as string).trim().length > 0
  );
  if (!baseValid) return false;
  if (
    emailOptional &&
    data.email.trim().length > 0 &&
    !isValidEmail(data.email.trim())
  ) {
    return false;
  }
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
  submitLabel,
  id,
  bookingFlowLocale = 'en',
  emailOptional = false,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const cf = ui.customerForm;
  const effectiveSubmitLabel = submitLabel ?? ui.calendar.reviewBookingCta;

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CustomerFormData, string>>
  >({});

  const update = (updates: Partial<CustomerFormData>) => {
    onChange({ ...value, ...updates });
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!value.fullName.trim()) next.fullName = cf.errFullName;
    if (!emailOptional && !value.email.trim()) next.email = cf.errEmail;
    if (
      emailOptional &&
      value.email.trim().length > 0 &&
      !isValidEmail(value.email.trim())
    ) {
      next.email = cf.errEmailInvalid;
    }
    if (!value.phone.trim()) next.phone = cf.errPhone;
    if (!value.streetAddress.trim()) next.streetAddress = cf.errStreet;
    if (!value.city.trim()) next.city = cf.errCity;
    if (!value.state.trim()) next.state = cf.errState;
    if (!value.zip.trim()) next.zip = cf.errZip;
    if (showVehicleFields) {
      if (!value.vehicleYear.trim()) next.vehicleYear = cf.errVehicleYear;
      if (!value.vehicleMake.trim()) next.vehicleMake = cf.errVehicleMake;
      if (!value.vehicleModel.trim()) next.vehicleModel = cf.errVehicleModel;
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
          {cf.yourDetails}
        </h2>
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={cf.fullName}
              value={value.fullName}
              onChange={v => update({ fullName: v })}
              placeholder="Jane Doe"
              error={errors.fullName}
              required
            />
            <div className="space-y-1.5">
              <Input
                label={emailOptional ? cf.emailOptional : cf.email}
                type="email"
                value={value.email}
                onChange={v => update({ email: v })}
                placeholder="jane@example.com"
                error={errors.email}
                required={!emailOptional}
              />
              {emailOptional && !value.email.trim() ? (
                <p className="text-xs text-gray-500 leading-snug">
                  {cf.emailOptionalNoConfirmation}
                </p>
              ) : null}
            </div>
          </div>
          <div className="sm:max-w-xs">
            <PhoneInput
              label={cf.phone}
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
          {cf.serviceAddress}
        </h2>
        <div className="space-y-3 border-t border-white/10 pt-3">
          <Input
            label={cf.streetAddress}
            value={value.streetAddress}
            onChange={v => update({ streetAddress: v })}
            placeholder="123 Main St"
            error={errors.streetAddress}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4">
            <Input
              label={cf.unitApt}
              value={value.unitApt}
              onChange={v => update({ unitApt: v })}
              placeholder="Apt 4B"
            />
            <Input
              label={cf.city}
              value={value.city}
              onChange={v => update({ city: v })}
              placeholder="City"
              error={errors.city}
              required
            />
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
              <Input
                label={cf.state}
                value={value.state}
                onChange={v => update({ state: v.toUpperCase().slice(0, 2) })}
                placeholder="ST"
                error={errors.state}
                required
                maxLength={2}
              />
              <Input
                label={cf.zip}
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
            {cf.vehicle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-3">
            <Input
              label={cf.year}
              value={value.vehicleYear}
              onChange={v => update({ vehicleYear: v })}
              placeholder="2018"
              error={errors.vehicleYear}
              required
            />
            <Input
              label={cf.make}
              value={value.vehicleMake}
              onChange={v => update({ vehicleMake: v })}
              placeholder="Toyota"
              error={errors.vehicleMake}
              required
            />
            <Input
              label={cf.model}
              value={value.vehicleModel}
              onChange={v => update({ vehicleModel: v })}
              placeholder="Camry"
              error={errors.vehicleModel}
              required
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <TextArea
          label={cf.notesOptional}
          value={value.notes}
          onChange={v => update({ notes: v })}
          placeholder={cf.notesPlaceholder}
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
            {effectiveSubmitLabel}
          </Button>
        </div>
      )}
    </form>
  );
};
