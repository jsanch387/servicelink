'use client';

import { API_ROUTES } from '@/constants/routes';
import {
  getBusinessBookV2CartUrl,
  getBusinessBookV2ReviewUrl,
  getBusinessBookV2TimeUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_EMAIL_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_NOTES_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
  isValidUsZipDigits,
  sanitizeUsZipInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { isValidEmail } from '@/features/auth/utils/validation';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { ReturningBookingCustomer } from '@/features/booking-v2/server/lookupReturningBookingCustomer';
import {
  formatUsPhoneDigits,
  normalizeUsPhoneDigits,
} from '@/lib/formatUsPhone';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { BookingV2Cart, BookingV2Customer } from '../types';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import {
  readBookingV2Cart,
  saveBookingV2Customer,
} from '../utils/bookingV2Cart';
import { formatCartDollars } from '../utils/formatCartMoney';
import {
  formatBookingClock,
  formatBookingDay,
} from '../utils/formatBookingTime';
import { BookingDetailsStreetField } from './BookingDetailsStreetField';
import { BookingV2ContinueFooter } from './BookingV2ContinueFooter';
import { ServiceSetupHeader } from './ServiceSetupHeader';

export function BookingDetailsScreen({
  businessSlug,
  bookingFlowLocale,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const flowUi = publicBookingUi(bookingFlowLocale);
  const ui = flowUi.bookingV2;
  const router = useRouter();
  const [cart, setCart] = useState<BookingV2Cart | null>(null);
  const [customer, setCustomer] = useState<BookingV2Customer | null>(null);

  useEffect(() => {
    const next = readBookingV2Cart(businessSlug);
    if (next.items.length === 0) {
      router.replace(
        getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    if (!next.schedule) {
      router.replace(
        getBusinessBookV2TimeUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    setCart(next);
    setCustomer(next.customer);
  }, [businessSlug, bookingFlowLocale, router]);

  useEffect(() => {
    if (!customer) return;
    saveBookingV2Customer(businessSlug, customer);
  }, [businessSlug, customer]);

  const phone = customer?.phone ?? '';

  useEffect(() => {
    if (phone.length !== 10) return;
    const controller = new AbortController();
    const url = new URL(
      API_ROUTES.PUBLIC_BOOKING_RETURNING_CUSTOMER,
      window.location.origin
    );
    url.searchParams.set('businessSlug', businessSlug);
    url.searchParams.set('phone', phone);
    void fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        if (!response.ok) return null;
        return (await response.json()) as {
          customer?: ReturningBookingCustomer | null;
        };
      })
      .then(payload => {
        const found = payload?.customer;
        if (!found) return;
        setCustomer(current => {
          if (!current || current.phone !== phone) return current;
          return fillBlankCustomerFields(current, found);
        });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [businessSlug, phone]);

  if (!cart?.schedule || !customer) return <BookFlowLoadingState />;

  const needsAddress = cart.serviceLocation !== 'shop';
  const totals = cartVisitTotals(cart.items);
  const durationMinutes = totals.durationMinutes;
  const emailInvalid =
    customer.email.trim().length > 0 && !isValidEmail(customer.email.trim());
  const canContinue = isCustomerReady(customer, needsAddress) && !emailInvalid;
  const update = (patch: Partial<BookingV2Customer>) =>
    setCustomer(current => (current ? { ...current, ...patch } : current));

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={getBusinessBookV2TimeUrl(businessSlug, {
          lang: bookingFlowLocale,
        })}
        backLabel={ui.back}
        step={3}
        stepTitle={ui.yourDetails}
      />
      <main className="flex flex-1 flex-col gap-7 px-5 pb-36 pt-7">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.6px]">
            {ui.yourDetails}
          </h1>
          <p className="mt-0.5 text-[15px] leading-5 text-[#A3A3A3]">
            {ui.detailsRequiredHint}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold leading-5">{ui.contact}</h2>
          <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
            <label className="block px-4 py-3">
              <span className="block text-[13px] leading-4 text-[#8F8F8F]">
                {ui.phone}
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <span
                  className={`text-[16px] leading-5 ${
                    customer.phone ? 'text-white' : 'text-[#6B6B6B]'
                  }`}
                  aria-hidden
                >
                  +1
                </span>
                <input
                  value={formatUsPhoneDigits(customer.phone)}
                  placeholder="(555) 123-4567"
                  aria-label={ui.phone}
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={event =>
                    update({
                      phone: normalizeUsPhoneDigits(event.target.value),
                    })
                  }
                  className="min-w-0 flex-1 bg-transparent text-[16px] leading-5 text-white outline-none placeholder:text-[#6B6B6B]"
                />
              </span>
            </label>
            <DetailField
              label={ui.fullName}
              value={customer.fullName}
              placeholder={ui.namePlaceholder}
              autoComplete="name"
              maxLength={BOOKING_CUSTOMER_FULL_NAME_MAX}
              onChange={fullName => update({ fullName })}
              edge="top"
            />
            <DetailField
              label={ui.emailOptional}
              value={customer.email}
              placeholder={ui.emailPlaceholder}
              autoComplete="email"
              inputMode="email"
              maxLength={BOOKING_CUSTOMER_EMAIL_MAX}
              onChange={email => update({ email })}
              edge="top"
            />
          </div>
          {emailInvalid ? (
            <p className="text-[13px] text-red-400" role="alert">
              {flowUi.customerForm.errEmailInvalid}
            </p>
          ) : null}
        </section>

        {needsAddress ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-[17px] font-semibold leading-5">
              {ui.serviceAddress}
            </h2>
            <div className="rounded-2xl border border-[#262626] bg-[#181818]">
              <BookingDetailsStreetField
                label={ui.streetAddress}
                value={customer.streetAddress}
                placeholder={ui.streetPlaceholder}
                onChange={streetAddress =>
                  update({
                    streetAddress: streetAddress.slice(
                      0,
                      BOOKING_CUSTOMER_STREET_MAX
                    ),
                  })
                }
                onPick={location =>
                  update({
                    streetAddress: (
                      location.street ||
                      location.label.split(',')[0] ||
                      ''
                    ).slice(0, BOOKING_CUSTOMER_STREET_MAX),
                    city: location.city.slice(0, BOOKING_CUSTOMER_CITY_MAX),
                    state: location.state.toUpperCase().slice(0, 2),
                    zip: sanitizeUsZipInput(location.zip),
                  })
                }
              />
              <DetailField
                label={ui.unitOptional}
                value={customer.unitApt}
                placeholder={ui.unitPlaceholder}
                autoComplete="address-line2"
                maxLength={BOOKING_CUSTOMER_UNIT_MAX}
                onChange={unitApt => update({ unitApt })}
                edge="top"
              />
              <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr] border-t border-[#262626]">
                <DetailField
                  label={ui.city}
                  value={customer.city}
                  placeholder={ui.cityPlaceholder}
                  autoComplete="address-level2"
                  maxLength={BOOKING_CUSTOMER_CITY_MAX}
                  onChange={city => update({ city })}
                />
                <DetailField
                  label={ui.state}
                  value={customer.state}
                  placeholder={ui.statePlaceholder}
                  autoComplete="address-level1"
                  maxLength={2}
                  onChange={state =>
                    update({
                      state: state
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .slice(0, 2),
                    })
                  }
                  edge="left"
                />
                <DetailField
                  label={ui.zip}
                  value={customer.zip}
                  placeholder={ui.zipPlaceholder}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={5}
                  onChange={zip => update({ zip: sanitizeUsZipInput(zip) })}
                  edge="left"
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold leading-5">
            {ui.noteForUs}{' '}
            <span className="text-[15px] font-normal text-[#8F8F8F]">
              {ui.optional}
            </span>
          </h2>
          <textarea
            value={customer.notes}
            aria-label={ui.noteForUs}
            placeholder={ui.notePlaceholder}
            rows={3}
            maxLength={BOOKING_CUSTOMER_NOTES_MAX}
            onChange={event =>
              update({
                notes: event.target.value.slice(0, BOOKING_CUSTOMER_NOTES_MAX),
              })
            }
            className="w-full resize-none rounded-2xl border border-[#262626] bg-[#181818] px-4 py-3.5 text-[16px] leading-6 text-white outline-none placeholder:text-[#6B6B6B]"
          />
        </section>
      </main>
      <BookingV2ContinueFooter
        primary={`${formatBookingDay(dateFromYmd(cart.schedule.date), bookingFlowLocale)} · ${formatBookingClock(cart.schedule.time, bookingFlowLocale, true)}`}
        secondary={`${formatCartDollars(totals.dueCents)} · ${formatDurationMinutes(durationMinutes, bookingFlowLocale)}`}
        continueLabel={ui.continue}
        disabled={!canContinue}
        onContinue={() => {
          saveBookingV2Customer(businessSlug, customer);
          router.push(
            getBusinessBookV2ReviewUrl(businessSlug, {
              lang: bookingFlowLocale,
            })
          );
        }}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
  placeholder,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
  edge,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  edge?: 'top' | 'left';
}) {
  return (
    <label
      className={`block px-4 py-3 ${
        edge === 'top'
          ? 'border-t border-[#262626]'
          : edge === 'left'
            ? 'border-l border-[#262626]'
            : ''
      }`}
    >
      <span className="block text-[13px] leading-4 text-[#8F8F8F]">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={event => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-[16px] leading-5 text-white outline-none placeholder:text-[#6B6B6B]"
      />
    </label>
  );
}

function fillBlankCustomerFields(
  current: BookingV2Customer,
  found: ReturningBookingCustomer
): BookingV2Customer {
  const pick = (existing: string, next: string, max: number) =>
    existing.trim() ? existing : next.slice(0, max);
  return {
    ...current,
    fullName: pick(
      current.fullName,
      found.fullName,
      BOOKING_CUSTOMER_FULL_NAME_MAX
    ),
    email: pick(current.email, found.email, BOOKING_CUSTOMER_EMAIL_MAX),
    streetAddress: pick(
      current.streetAddress,
      found.streetAddress,
      BOOKING_CUSTOMER_STREET_MAX
    ),
    unitApt: pick(current.unitApt, found.unitApt, BOOKING_CUSTOMER_UNIT_MAX),
    city: pick(current.city, found.city, BOOKING_CUSTOMER_CITY_MAX),
    state: current.state.trim() ? current.state : found.state,
    zip: current.zip.trim() ? current.zip : found.zip,
  };
}

function isCustomerReady(
  customer: BookingV2Customer,
  needsAddress: boolean
): boolean {
  if (customer.phone.length !== 10) return false;
  if (!customer.fullName.trim()) return false;
  if (customer.fullName.trim().length > BOOKING_CUSTOMER_FULL_NAME_MAX) {
    return false;
  }
  if (!needsAddress) return true;
  return (
    Boolean(customer.streetAddress.trim()) &&
    customer.streetAddress.trim().length <= BOOKING_CUSTOMER_STREET_MAX &&
    Boolean(customer.city.trim()) &&
    customer.city.trim().length <= BOOKING_CUSTOMER_CITY_MAX &&
    customer.state.trim().length === 2 &&
    isValidUsZipDigits(customer.zip)
  );
}

function dateFromYmd(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}
