'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import {
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { BookingSaleAppliesNotice } from '@/features/marketing/components/BookingSaleAppliesNotice';
import { VehicleIcon } from '@/icons/VehicleIcon';
import type { AddOnDisplay, CustomerFormData } from '../types';
import { formatBookingWallTime } from '../utils/formatBookingWallTime';
import { formatDurationMinutes } from '../utils/formatDuration';

function formatAddress(customer: CustomerFormData): string {
  const parts = [
    customer.streetAddress,
    customer.unitApt.trim() ? customer.unitApt : null,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

function formatVehicle(customer: CustomerFormData): string | null {
  const parts = [
    customer.vehicleYear?.trim() ? customer.vehicleYear.trim() : null,
    customer.vehicleMake?.trim() ? customer.vehicleMake.trim() : null,
    customer.vehicleModel?.trim() ? customer.vehicleModel.trim() : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function SummaryDetailRow({
  icon: Icon,
  children,
  isLast = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 px-4 py-3.5 ${isLast ? '' : 'border-b border-white/[0.06]'}`}
    >
      <Icon className="h-5 w-5 shrink-0 text-gray-500 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

interface BookingSummaryProps {
  serviceName: string;
  serviceDurationMinutes: number;
  /** When set (e.g. base service + add-on time), shown as appointment length. */
  totalAppointmentMinutes?: number;
  servicePriceCents?: number;
  serviceVariantLabel?: string;
  /** Add-ons selected on the service details page. */
  selectedAddOns?: AddOnDisplay[];
  /** Total price including base service + add-ons. */
  totalPriceCents?: number;
  saleSubtotalCents?: number;
  saleEstimatedTotalCents?: number;
  saleAppliesLine?: string | null;
  date: string;
  /** Local wall time `HH:mm` (24h); formatted for display using `bookingFlowLocale`. */
  startTimeHhmm: string;
  customer: CustomerFormData;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Shop visit — show business address instead of customer-entered address. */
  isShopBooking?: boolean;
  shopAddressLabel?: string | null;
  /** Owner manual shop booking — omit address on review (owner already knows shop). */
  hideServiceAddress?: boolean;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  serviceName,
  serviceDurationMinutes,
  totalAppointmentMinutes,
  servicePriceCents,
  serviceVariantLabel,
  selectedAddOns = [],
  totalPriceCents,
  saleSubtotalCents,
  saleEstimatedTotalCents,
  saleAppliesLine,
  date,
  startTimeHhmm,
  customer,
  bookingFlowLocale = 'en',
  isShopBooking = false,
  shopAddressLabel = null,
  hideServiceAddress = false,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const sl = ui.serviceLocation;
  const totalMinutes = totalAppointmentMinutes ?? serviceDurationMinutes;
  const customerAddress = formatAddress(customer);
  const showAddress =
    !hideServiceAddress &&
    (isShopBooking && shopAddressLabel
      ? true
      : Boolean(customerAddress.trim()));
  const addressLabel = isShopBooking
    ? sl.shopVisitAddressLabel
    : ui.common.address;
  const addressDisplay = isShopBooking
    ? (shopAddressLabel ?? '')
    : customerAddress;
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(
    bcp47ForBookingLocale(bookingFlowLocale),
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }
  );
  const timeDisplay = formatBookingWallTime(startTimeHhmm, bookingFlowLocale);
  const vehicle = formatVehicle(customer);
  const email = customer.email.trim();
  const phone = formatPhoneUsDisplay(customer.phone);
  const showSalePricing =
    Boolean(saleAppliesLine) &&
    saleSubtotalCents != null &&
    saleSubtotalCents > 0 &&
    saleEstimatedTotalCents != null &&
    saleEstimatedTotalCents < saleSubtotalCents;
  const hasAddOns = selectedAddOns.length > 0;
  const hasPrice = totalPriceCents != null && totalPriceCents > 0;
  const showServicePrice = servicePriceCents != null && servicePriceCents > 0;
  const showPriceFooter =
    hasPrice && (hasAddOns || showSalePricing || Boolean(saleAppliesLine));

  const detailRows: Array<{
    key: string;
    icon: React.ComponentType<{ className?: string }>;
    content: React.ReactNode;
  }> = [
    {
      key: 'contact',
      icon: UserCircleIcon,
      content: (
        <>
          <p className="font-medium text-white leading-snug">{customer.fullName}</p>
          <div className="mt-1 space-y-0.5 text-sm text-gray-400">
            <p>{email || ui.common.emailNotProvided}</p>
            <p>{phone}</p>
          </div>
        </>
      ),
    },
  ];

  if (showAddress) {
    detailRows.push({
      key: 'address',
      icon: MapPinIcon,
      content: (
        <>
          <p className="text-xs text-gray-500 mb-0.5">{addressLabel}</p>
          <p className="text-sm text-white leading-relaxed">{addressDisplay}</p>
        </>
      ),
    });
  }

  if (vehicle) {
    detailRows.push({
      key: 'vehicle',
      icon: VehicleIcon,
      content: (
        <>
          <p className="text-xs text-gray-500 mb-0.5">{ui.common.vehicle}</p>
          <p className="text-sm text-white">{vehicle}</p>
        </>
      ),
    });
  }

  if (customer.notes.trim()) {
    detailRows.push({
      key: 'notes',
      icon: ChatBubbleLeftEllipsisIcon,
      content: (
        <>
          <p className="text-xs text-gray-500 mb-0.5">{ui.common.notes}</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {customer.notes}
          </p>
        </>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        {ui.calendar.reviewBooking}
      </h2>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
        <div className="flex gap-3.5 items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] border border-white/10">
            <CalendarDaysIcon className="h-5 w-5 text-white/85" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-white leading-snug">
              {dateFormatted}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-300">
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                {timeDisplay}
              </span>
              <span aria-hidden className="text-gray-600">
                &bull;
              </span>
              <span className="text-gray-400 tabular-nums">
                {formatDurationMinutes(totalMinutes, bookingFlowLocale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white leading-snug">{serviceName}</p>
            {serviceVariantLabel ? (
              <p className="mt-0.5 text-sm text-gray-400">{serviceVariantLabel}</p>
            ) : null}
          </div>
          {showServicePrice ? (
            <span className="text-sm text-gray-300 tabular-nums shrink-0 pt-0.5">
              {formatCents(servicePriceCents!)}
            </span>
          ) : null}
        </div>

        {hasAddOns ? (
          <ul className="px-4 pb-3 space-y-2 border-t border-white/[0.06] pt-3 mx-0">
            {selectedAddOns.map(addOn => (
              <li
                key={addOn.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-gray-300 min-w-0 truncate">
                  {addOn.name}
                </span>
                <span className="text-gray-400 tabular-nums shrink-0">
                  +{formatCents(addOn.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {showPriceFooter ? (
          <div className="px-4 py-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-300">
                {ui.common.bookingTotal}
              </span>
              {showSalePricing ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-zinc-500 line-through decoration-zinc-500/70 tabular-nums">
                    {formatCents(saleSubtotalCents!)}
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {formatCents(saleEstimatedTotalCents!)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-white tabular-nums">
                  {formatCents(totalPriceCents!)}
                </span>
              )}
            </div>
            {saleAppliesLine ? (
              <BookingSaleAppliesNotice line={saleAppliesLine} />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {detailRows.map((row, index) => (
          <SummaryDetailRow
            key={row.key}
            icon={row.icon}
            isLast={index === detailRows.length - 1}
          >
            {row.content}
          </SummaryDetailRow>
        ))}
      </div>
    </div>
  );
};
