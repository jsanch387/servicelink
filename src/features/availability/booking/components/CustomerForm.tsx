'use client';

import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { isValidEmail } from '@/features/auth/utils/validation';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { CustomerFormData } from '../types';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_EMAIL_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_NOTES_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  isValidUsZipDigits,
  isValidVehicleYearFourDigit,
  sanitizeUsZipInput,
  sanitizeVehicleYearInput,
} from '../utils/bookingCustomerFieldLimits';

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

  const emailTrim = data.email.trim();
  if (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX) return false;
  if (!emailOptional) {
    if (!isValidEmail(emailTrim)) return false;
  } else if (emailTrim.length > 0 && !isValidEmail(emailTrim)) {
    return false;
  }

  if (data.fullName.trim().length > BOOKING_CUSTOMER_FULL_NAME_MAX)
    return false;
  if (data.streetAddress.trim().length > BOOKING_CUSTOMER_STREET_MAX)
    return false;
  if (data.unitApt.trim().length > BOOKING_CUSTOMER_UNIT_MAX) return false;
  if (data.city.trim().length > BOOKING_CUSTOMER_CITY_MAX) return false;
  if (!isValidUsZipDigits(sanitizeUsZipInput(data.zip))) return false;
  if (data.notes.length > BOOKING_CUSTOMER_NOTES_MAX) return false;

  if (!requireVehicleFields) return true;
  const vy = data.vehicleYear.trim();
  const vmk = data.vehicleMake.trim();
  const vmd = data.vehicleModel.trim();
  if (!vy || !vmk || !vmd) return false;
  if (!isValidVehicleYearFourDigit(vy)) return false;
  if (vmk.length > BOOKING_VEHICLE_MAKE_MAX) return false;
  if (vmd.length > BOOKING_VEHICLE_MODEL_MAX) return false;
  return true;
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
    const emailTrim = value.email.trim();
    if (!value.fullName.trim()) next.fullName = cf.errFullName;
    else if (value.fullName.trim().length > BOOKING_CUSTOMER_FULL_NAME_MAX)
      next.fullName = cf.errValueTooLong;

    if (!emailOptional) {
      if (!emailTrim) next.email = cf.errEmail;
      else if (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX)
        next.email = cf.errEmailInvalid;
      else if (!isValidEmail(emailTrim)) next.email = cf.errEmailInvalid;
    } else if (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX) {
      next.email = cf.errEmailInvalid;
    } else if (emailTrim.length > 0 && !isValidEmail(emailTrim)) {
      next.email = cf.errEmailInvalid;
    }

    if (!value.phone.trim()) next.phone = cf.errPhone;
    if (!value.streetAddress.trim()) next.streetAddress = cf.errStreet;
    else if (value.streetAddress.trim().length > BOOKING_CUSTOMER_STREET_MAX)
      next.streetAddress = cf.errValueTooLong;
    if (value.unitApt.trim().length > BOOKING_CUSTOMER_UNIT_MAX)
      next.unitApt = cf.errValueTooLong;

    if (!value.city.trim()) next.city = cf.errCity;
    else if (value.city.trim().length > BOOKING_CUSTOMER_CITY_MAX)
      next.city = cf.errValueTooLong;

    if (!value.state.trim()) next.state = cf.errState;

    const zipDigits = sanitizeUsZipInput(value.zip);
    if (!zipDigits) next.zip = cf.errZip;
    else if (!isValidUsZipDigits(zipDigits)) next.zip = cf.errZipInvalid;

    if (value.notes.length > BOOKING_CUSTOMER_NOTES_MAX) {
      next.notes = cf.errValueTooLong;
    }

    if (showVehicleFields) {
      const vy = value.vehicleYear.trim();
      const vmk = value.vehicleMake.trim();
      const vmd = value.vehicleModel.trim();
      if (!vy) next.vehicleYear = cf.errVehicleYear;
      else if (!isValidVehicleYearFourDigit(vy))
        next.vehicleYear = cf.errVehicleYearInvalid;
      if (!vmk) next.vehicleMake = cf.errVehicleMake;
      else if (vmk.length > BOOKING_VEHICLE_MAKE_MAX)
        next.vehicleMake = cf.errValueTooLong;
      if (!vmd) next.vehicleModel = cf.errVehicleModel;
      else if (vmd.length > BOOKING_VEHICLE_MODEL_MAX)
        next.vehicleModel = cf.errValueTooLong;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit();
  };

  const emailTrim = value.email.trim();
  const emailFormatLooksInvalid =
    emailTrim.length > 0 && !isValidEmail(emailTrim);

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
              onChange={v =>
                update({ fullName: v.slice(0, BOOKING_CUSTOMER_FULL_NAME_MAX) })
              }
              placeholder="Jane Doe"
              error={errors.fullName}
              required
              maxLength={BOOKING_CUSTOMER_FULL_NAME_MAX}
            />
            <div className="space-y-1.5">
              <Input
                label={emailOptional ? cf.emailOptional : cf.email}
                type="email"
                value={value.email}
                onChange={v => {
                  update({ email: v.slice(0, BOOKING_CUSTOMER_EMAIL_MAX) });
                  setErrors(prev =>
                    prev.email ? { ...prev, email: undefined } : prev
                  );
                }}
                placeholder="jane@example.com"
                error={errors.email}
                required={!emailOptional}
                maxLength={BOOKING_CUSTOMER_EMAIL_MAX}
              />
              {!errors.email && emailFormatLooksInvalid ? (
                <p
                  className="mt-1 text-sm text-red-400 leading-snug"
                  role="alert"
                  aria-live="polite"
                >
                  {cf.errEmailInvalid}
                </p>
              ) : null}
              {emailOptional && !value.email.trim() && !errors.email ? (
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
            onChange={v =>
              update({
                streetAddress: v.slice(0, BOOKING_CUSTOMER_STREET_MAX),
              })
            }
            placeholder="123 Main St"
            error={errors.streetAddress}
            required
            maxLength={BOOKING_CUSTOMER_STREET_MAX}
          />
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4">
            <Input
              label={cf.unitApt}
              value={value.unitApt}
              onChange={v =>
                update({ unitApt: v.slice(0, BOOKING_CUSTOMER_UNIT_MAX) })
              }
              placeholder="Apt 4B"
              maxLength={BOOKING_CUSTOMER_UNIT_MAX}
              error={errors.unitApt}
            />
            <Input
              label={cf.city}
              value={value.city}
              onChange={v =>
                update({ city: v.slice(0, BOOKING_CUSTOMER_CITY_MAX) })
              }
              placeholder="City"
              error={errors.city}
              required
              maxLength={BOOKING_CUSTOMER_CITY_MAX}
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
                onChange={v => update({ zip: sanitizeUsZipInput(v) })}
                placeholder="78701"
                error={errors.zip}
                required
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
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
              onChange={v =>
                update({ vehicleYear: sanitizeVehicleYearInput(v) })
              }
              placeholder="2018"
              error={errors.vehicleYear}
              required
              inputMode="numeric"
              maxLength={4}
            />
            <Input
              label={cf.make}
              value={value.vehicleMake}
              onChange={v =>
                update({ vehicleMake: v.slice(0, BOOKING_VEHICLE_MAKE_MAX) })
              }
              placeholder="Toyota"
              error={errors.vehicleMake}
              required
              maxLength={BOOKING_VEHICLE_MAKE_MAX}
            />
            <Input
              label={cf.model}
              value={value.vehicleModel}
              onChange={v =>
                update({ vehicleModel: v.slice(0, BOOKING_VEHICLE_MODEL_MAX) })
              }
              placeholder="Camry"
              error={errors.vehicleModel}
              required
              maxLength={BOOKING_VEHICLE_MODEL_MAX}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <TextArea
          label={cf.notesOptional}
          value={value.notes}
          onChange={v =>
            update({ notes: v.slice(0, BOOKING_CUSTOMER_NOTES_MAX) })
          }
          placeholder={cf.notesPlaceholder}
          rows={3}
          maxLength={BOOKING_CUSTOMER_NOTES_MAX}
          hideCharCount
          error={errors.notes}
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
