'use client';

import {
  Button,
  FormStepSection,
  Input,
  PhoneInput,
  SmsNotificationsConsent,
  TextArea,
} from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { isValidEmail } from '@/features/auth/utils/validation';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { BookingVehicleFields } from './BookingVehicleFields';
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
} from '../utils/bookingCustomerFieldLimits';

export type CustomerFormStep = 'contact' | 'address' | 'vehicleNotes';

interface CustomerFormProps {
  value: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  onSubmit: () => void;
  /** Which section of the multi-step details form to show. */
  step: CustomerFormStep;
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
  /** Public booking: SMS consent shown next to phone input (Pinggram / TCPA). */
  showNotificationsConsent?: boolean;
  /** Owner manual booking: contact section uses "Customer information" title. */
  isOwnerManualBooking?: boolean;
  businessName?: string;
  agreedToNotifications?: boolean;
  onAgreedToNotificationsChange?: (agreed: boolean) => void;
  notificationsConsentError?: string | null;
}

function isContactStepValid(
  data: CustomerFormData,
  emailOptional: boolean
): boolean {
  if (!data.fullName.trim()) return false;
  if (data.fullName.trim().length > BOOKING_CUSTOMER_FULL_NAME_MAX)
    return false;

  const emailTrim = data.email.trim();
  if (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX) return false;
  if (!emailOptional) {
    if (!emailTrim || !isValidEmail(emailTrim)) return false;
  } else if (emailTrim.length > 0 && !isValidEmail(emailTrim)) {
    return false;
  }

  if (!data.phone.trim()) return false;
  return true;
}

function isAddressStepValid(data: CustomerFormData): boolean {
  if (!data.streetAddress.trim()) return false;
  if (data.streetAddress.trim().length > BOOKING_CUSTOMER_STREET_MAX)
    return false;
  if (data.unitApt.trim().length > BOOKING_CUSTOMER_UNIT_MAX) return false;
  if (!data.city.trim()) return false;
  if (data.city.trim().length > BOOKING_CUSTOMER_CITY_MAX) return false;
  if (!data.state.trim()) return false;
  if (!isValidUsZipDigits(sanitizeUsZipInput(data.zip))) return false;
  return true;
}

function isVehicleNotesStepValid(
  data: CustomerFormData,
  requireVehicleFields: boolean
): boolean {
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

export function isCustomerFormStepValid(
  data: CustomerFormData,
  step: CustomerFormStep,
  requireVehicleFields = false,
  emailOptional = false
): boolean {
  if (step === 'contact') return isContactStepValid(data, emailOptional);
  if (step === 'address') return isAddressStepValid(data);
  return isVehicleNotesStepValid(data, requireVehicleFields);
}

export function isCustomerFormValid(
  data: CustomerFormData,
  requireVehicleFields = false,
  emailOptional = false,
  requireCustomerAddress = true
): boolean {
  return (
    isContactStepValid(data, emailOptional) &&
    (requireCustomerAddress ? isAddressStepValid(data) : true) &&
    isVehicleNotesStepValid(data, requireVehicleFields)
  );
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  value,
  onChange,
  onSubmit,
  step,
  showVehicleFields = false,
  hideSubmitButton = false,
  submitLabel,
  id,
  bookingFlowLocale = 'en',
  emailOptional = false,
  showNotificationsConsent = false,
  isOwnerManualBooking = false,
  businessName = '',
  agreedToNotifications = false,
  onAgreedToNotificationsChange,
  notificationsConsentError = null,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const cf = ui.customerForm;
  const effectiveSubmitLabel = submitLabel ?? ui.common.continue;
  const contactSectionTitle = isOwnerManualBooking
    ? cf.customerDetails
    : cf.yourDetails;

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CustomerFormData, string>>
  >({});

  const update = (updates: Partial<CustomerFormData>) => {
    onChange({ ...value, ...updates });
  };

  const validateStep = (): boolean => {
    const next: Partial<Record<keyof CustomerFormData, string>> = {};

    if (step === 'contact') {
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
    }

    if (step === 'address') {
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
    }

    if (step === 'vehicleNotes') {
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
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    onSubmit();
  };

  const emailTrim = value.email.trim();
  const emailFormatLooksInvalid =
    emailTrim.length > 0 && !isValidEmail(emailTrim);

  const notificationsConsentFooter =
    showNotificationsConsent && step === 'contact' ? (
      <SmsNotificationsConsent
        businessName={businessName}
        agreed={agreedToNotifications}
        onAgreedChange={onAgreedToNotificationsChange ?? (() => {})}
        error={notificationsConsentError}
        bookingFlowLocale={bookingFlowLocale}
      />
    ) : null;

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {step === 'contact' && (
        <FormStepSection
          title={contactSectionTitle}
          footer={notificationsConsentFooter}
        >
          <Input
            label={cf.fullName}
            value={value.fullName}
            onChange={v =>
              update({
                fullName: v.slice(0, BOOKING_CUSTOMER_FULL_NAME_MAX),
              })
            }
            placeholder="Jane Doe"
            error={errors.fullName}
            required
            maxLength={BOOKING_CUSTOMER_FULL_NAME_MAX}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
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
        </FormStepSection>
      )}

      {step === 'address' && (
        <FormStepSection title={cf.serviceAddress}>
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
                maxLength={5}
              />
            </div>
          </div>
        </FormStepSection>
      )}

      {step === 'vehicleNotes' && (
        <div className="space-y-6">
          {showVehicleFields && (
            <FormStepSection title={cf.vehicle}>
              <BookingVehicleFields
                value={{
                  vehicleYear: value.vehicleYear,
                  vehicleMake: value.vehicleMake,
                  vehicleModel: value.vehicleModel,
                }}
                onChange={updates => update(updates)}
                errors={{
                  vehicleYear: errors.vehicleYear,
                  vehicleMake: errors.vehicleMake,
                  vehicleModel: errors.vehicleModel,
                }}
                bookingFlowLocale={bookingFlowLocale}
              />
            </FormStepSection>
          )}

          <div className="space-y-2">
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
              inputClassName="!rounded-[10px]"
              error={errors.notes}
            />
          </div>
        </div>
      )}

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
