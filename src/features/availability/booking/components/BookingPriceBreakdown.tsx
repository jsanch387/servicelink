'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { BookingSaleAppliesNotice } from '@/features/marketing/components/BookingSaleAppliesNotice';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { ClockIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { AddOnDisplay } from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';

export interface BookingPriceBreakdownProps {
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents?: number;
  /** Sub-line under service title (e.g. chosen vehicle size / price tier). */
  serviceVariantLabel?: string;
  selectedAddOns: AddOnDisplay[];
  totalBookingDurationMinutes: number;
  totalPriceCents?: number;
  /** Pre-discount subtotal when a sale applies to the appointment date. */
  saleSubtotalCents?: number;
  /** Estimated total after sale discount (display only; charged at completion). */
  saleEstimatedTotalCents?: number;
  /** e.g. "Summer Sale — 35% off applies" */
  saleAppliesLine?: string | null;
  /** Default `h2` (calendar step); use `h3` under a page-level heading on review. */
  serviceTitleTag?: 'h2' | 'h3';
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export function BookingPriceBreakdown({
  serviceName,
  serviceDurationMinutes,
  servicePriceCents,
  serviceVariantLabel,
  selectedAddOns,
  totalBookingDurationMinutes,
  totalPriceCents,
  saleSubtotalCents,
  saleEstimatedTotalCents,
  saleAppliesLine,
  serviceTitleTag = 'h2',
  bookingFlowLocale = 'en',
}: BookingPriceBreakdownProps) {
  const TitleTag = serviceTitleTag;
  const ui = publicBookingUi(bookingFlowLocale);
  const displayDurationMinutes =
    totalBookingDurationMinutes > 0
      ? totalBookingDurationMinutes
      : serviceDurationMinutes;
  const showSalePricing =
    Boolean(saleAppliesLine) &&
    saleSubtotalCents != null &&
    saleSubtotalCents > 0 &&
    saleEstimatedTotalCents != null &&
    saleEstimatedTotalCents < saleSubtotalCents;
  const saleSavingsCents = showSalePricing
    ? saleSubtotalCents! - saleEstimatedTotalCents!
    : 0;

  const renderPrice = (cents: number, className: string, prefix = '') => (
    <span className={`${className} shrink-0 text-right tabular-nums`}>
      {prefix}${(cents / 100).toFixed(2)}
    </span>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <TitleTag className="text-base font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                {serviceName || ui.common.service}
              </TitleTag>
              {serviceVariantLabel ? (
                <span className="mt-1.5 inline-flex max-w-full whitespace-normal rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-300 [overflow-wrap:anywhere]">
                  {serviceVariantLabel}
                </span>
              ) : null}
            </div>
            {servicePriceCents != null && servicePriceCents > 0
              ? renderPrice(
                  servicePriceCents,
                  'pt-0.5 text-sm font-medium text-zinc-200'
                )
              : null}
          </div>
        </div>

        {selectedAddOns.length > 0 ? (
          <div className="border-t border-white/10 pt-4">
            <ul className="space-y-2.5">
              {selectedAddOns.map(addOn => (
                <li
                  key={addOn.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="min-w-0 text-zinc-200 [overflow-wrap:anywhere]">
                    {addOn.name}
                  </span>
                  {renderPrice(addOn.priceCents, 'text-zinc-300', '+')}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {saleAppliesLine ? (
          <div className="border-t border-white/10 pt-4">
            <BookingSaleAppliesNotice line={saleAppliesLine} />
            {saleSavingsCents > 0 ? (
              <p className="mt-2 text-sm font-medium text-emerald-300/90">
                {ui.common.youSave(`$${(saleSavingsCents / 100).toFixed(2)}`)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 border-t border-white/10 bg-white/[0.035]">
        <div className="border-r border-white/10 px-4 py-3.5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {ui.common.duration}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
            <ClockIcon className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            {formatDurationMinutes(displayDurationMinutes, bookingFlowLocale)}
          </p>
        </div>
        <div className="px-4 py-3.5 text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {ui.common.total}
          </p>
          <div className="mt-1">
            {totalPriceCents != null && totalPriceCents > 0 ? (
              showSalePricing ? (
                <div className="flex flex-wrap items-baseline justify-end gap-x-2">
                  {renderPrice(
                    saleSubtotalCents!,
                    'text-xs font-medium text-zinc-500 line-through decoration-zinc-500/70'
                  )}
                  {renderPrice(
                    saleEstimatedTotalCents!,
                    'text-sm font-semibold text-white'
                  )}
                </div>
              ) : (
                renderPrice(totalPriceCents, 'text-sm font-semibold text-white')
              )
            ) : (
              <span className="text-sm font-semibold text-white">$0.00</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
