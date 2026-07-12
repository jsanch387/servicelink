'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { BookingSaleAppliesNotice } from '@/features/marketing/components/BookingSaleAppliesNotice';
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
  const showSalePricing =
    Boolean(saleAppliesLine) &&
    saleSubtotalCents != null &&
    saleSubtotalCents > 0 &&
    saleEstimatedTotalCents != null &&
    saleEstimatedTotalCents < saleSubtotalCents;

  const renderTotalPrice = (cents: number, className: string) => (
    <span className={`${className} tabular-nums shrink-0 text-right min-w-[4.5rem]`}>
      ${(cents / 100).toFixed(2)}
    </span>
  );

  return (
    <section>
      <div className="flex justify-between gap-4 items-start">
        <div className="min-w-0 flex-1">
          <TitleTag className="text-lg font-semibold text-white leading-snug">
            {serviceName || 'Booking'}
          </TitleTag>
          <div className="mt-0.5 flex items-center gap-1 text-sm tabular-nums italic">
            <p className="text-gray-400">
              {formatDurationMinutes(serviceDurationMinutes, bookingFlowLocale)}
            </p>
            {serviceVariantLabel ? (
              <>
                <span
                  aria-hidden="true"
                  className="text-gray-500 not-italic leading-none"
                >
                  &bull;
                </span>
                <p className="text-gray-500 not-italic">
                  {serviceVariantLabel}
                </p>
              </>
            ) : null}
          </div>
        </div>
        {servicePriceCents != null && servicePriceCents > 0 ? (
          <span className="text-sm text-gray-300 tabular-nums shrink-0 text-right min-w-[4.5rem] pt-0.5">
            ${(servicePriceCents / 100).toFixed(2)}
          </span>
        ) : null}
      </div>

      {selectedAddOns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          <ul className="space-y-3">
            {selectedAddOns.map(addOn => (
              <li
                key={addOn.id}
                className="flex justify-between gap-4 items-start"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-300">{addOn.name}</p>
                  {addOn.durationMinutes != null &&
                  addOn.durationMinutes > 0 ? (
                    <p className="text-sm text-gray-400 mt-0.5 tabular-nums italic">
                      +{' '}
                      {formatDurationMinutes(
                        addOn.durationMinutes,
                        bookingFlowLocale
                      )}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-gray-300 tabular-nums shrink-0 text-right min-w-[4.5rem] pt-0.5">
                  + ${(addOn.priceCents / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-start gap-4 pt-3 border-t border-white/10">
            <p className="text-sm font-semibold text-white tabular-nums italic">
              {formatDurationMinutes(
                totalBookingDurationMinutes,
                bookingFlowLocale
              )}
            </p>
            {totalPriceCents != null && totalPriceCents > 0 ? (
              showSalePricing ? (
                <div className="flex items-baseline justify-end gap-2 whitespace-nowrap">
                  {renderTotalPrice(
                    saleSubtotalCents!,
                    'text-sm font-medium text-zinc-500 line-through decoration-zinc-500/70'
                  )}
                  {renderTotalPrice(
                    saleEstimatedTotalCents!,
                    'text-base font-semibold text-white'
                  )}
                </div>
              ) : (
                renderTotalPrice(
                  totalPriceCents,
                  'text-base font-semibold text-white'
                )
              )
            ) : null}
          </div>
          {saleAppliesLine ? (
            <BookingSaleAppliesNotice line={saleAppliesLine} />
          ) : null}
        </div>
      )}
      {selectedAddOns.length === 0 &&
      saleAppliesLine &&
      totalPriceCents != null &&
      totalPriceCents > 0 ? (
        <BookingSaleAppliesNotice line={saleAppliesLine} />
      ) : null}
    </section>
  );
}
