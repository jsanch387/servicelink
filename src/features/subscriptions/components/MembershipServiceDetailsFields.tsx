'use client';

import { FormStepSection, Input, PhoneInput } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { BookingVehicleFields } from '@/features/availability/booking/components/BookingVehicleFields';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
  sanitizeUsZipInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';

export type MembershipServiceDetailsValue = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
};

export const EMPTY_MEMBERSHIP_SERVICE_DETAILS: MembershipServiceDetailsValue = {
  fullName: '',
  email: '',
  phone: '',
  street: '',
  unit: '',
  city: '',
  state: '',
  zip: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
};

type Props = {
  value: MembershipServiceDetailsValue;
  onChange: (next: MembershipServiceDetailsValue) => void;
  /** Show name / email / phone fields. */
  showContact?: boolean;
  /** Show address fields (mobile / both). */
  showAddress?: boolean;
  /** Show vehicle fields. */
  showVehicle?: boolean;
  /** Period rebook: show the membership vehicle, no editing. */
  vehicleReadOnly?: boolean;
  savedBanner?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
};

/**
 * Contact / address / vehicle for membership public flows.
 * Uses the same FormStepSection + glass cards as public booking.
 */
export function MembershipServiceDetailsFields({
  value,
  onChange,
  showContact = false,
  showAddress = true,
  showVehicle = true,
  vehicleReadOnly = false,
  savedBanner = null,
  bookingFlowLocale = 'en',
}: Props) {
  const ui = publicBookingUi(bookingFlowLocale);
  const cf = ui.customerForm;
  const patch = (partial: Partial<MembershipServiceDetailsValue>) =>
    onChange({ ...value, ...partial });
  const vehicleLine = [value.vehicleYear, value.vehicleMake, value.vehicleModel]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      {savedBanner ? (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-100/90">
          {savedBanner}
        </p>
      ) : null}

      {showContact ? (
        <FormStepSection title={cf.yourDetails}>
          <Input
            label={cf.fullName}
            value={value.fullName}
            onChange={fullName => patch({ fullName })}
            required
            autoComplete="name"
            placeholder="Jane Doe"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={cf.email}
              type="email"
              value={value.email}
              onChange={email => patch({ email })}
              required
              autoComplete="email"
              placeholder="jane@example.com"
            />
            <PhoneInput
              label={cf.phone}
              value={value.phone}
              onChange={phone => patch({ phone })}
              required
              showDigitHint
              placeholder="(555) 123-4567"
            />
          </div>
        </FormStepSection>
      ) : null}

      {showAddress ? (
        <FormStepSection title={cf.serviceAddress}>
          <Input
            label={cf.streetAddress}
            value={value.street}
            onChange={street =>
              patch({ street: street.slice(0, BOOKING_CUSTOMER_STREET_MAX) })
            }
            required
            autoComplete="street-address"
            placeholder="123 Main St"
            maxLength={BOOKING_CUSTOMER_STREET_MAX}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
            <Input
              label={cf.unitApt}
              value={value.unit}
              onChange={unit =>
                patch({ unit: unit.slice(0, BOOKING_CUSTOMER_UNIT_MAX) })
              }
              autoComplete="address-line2"
              placeholder="Apt 4B"
              maxLength={BOOKING_CUSTOMER_UNIT_MAX}
            />
            <Input
              label={cf.city}
              value={value.city}
              onChange={city =>
                patch({ city: city.slice(0, BOOKING_CUSTOMER_CITY_MAX) })
              }
              required
              autoComplete="address-level2"
              placeholder="City"
              maxLength={BOOKING_CUSTOMER_CITY_MAX}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
              <Input
                label={cf.state}
                value={value.state}
                onChange={state =>
                  patch({ state: state.toUpperCase().slice(0, 2) })
                }
                required
                autoComplete="address-level1"
                placeholder="ST"
                maxLength={2}
              />
              <Input
                label={cf.zip}
                value={value.zip}
                onChange={zip => patch({ zip: sanitizeUsZipInput(zip) })}
                required
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="78701"
                maxLength={5}
              />
            </div>
          </div>
        </FormStepSection>
      ) : null}

      {showVehicle ? (
        <FormStepSection title={cf.vehicle}>
          {vehicleReadOnly ? (
            <div>
              {vehicleLine ? (
                <p className="text-base font-medium text-white">{vehicleLine}</p>
              ) : (
                <p className="text-sm text-zinc-400">
                  {ui.subscriptions.vehicleLockedEmpty}
                </p>
              )}
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                {ui.subscriptions.vehicleLockedNote}
              </p>
            </div>
          ) : (
            <BookingVehicleFields
              value={{
                vehicleYear: value.vehicleYear,
                vehicleMake: value.vehicleMake,
                vehicleModel: value.vehicleModel,
              }}
              onChange={updates => patch(updates)}
              bookingFlowLocale={bookingFlowLocale}
              required
            />
          )}
        </FormStepSection>
      ) : null}
    </div>
  );
}
