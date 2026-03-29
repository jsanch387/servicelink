'use client';

import type { AddOnDisplay } from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';

export interface BookingPriceBreakdownProps {
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents?: number;
  selectedAddOns: AddOnDisplay[];
  totalBookingDurationMinutes: number;
  totalPriceCents?: number;
  /** Default `h2` (calendar step); use `h3` under a page-level heading on review. */
  serviceTitleTag?: 'h2' | 'h3';
}

export function BookingPriceBreakdown({
  serviceName,
  serviceDurationMinutes,
  servicePriceCents,
  selectedAddOns,
  totalBookingDurationMinutes,
  totalPriceCents,
  serviceTitleTag = 'h2',
}: BookingPriceBreakdownProps) {
  const TitleTag = serviceTitleTag;

  return (
    <section>
      <div className="flex justify-between gap-4 items-start">
        <div className="min-w-0 flex-1">
          <TitleTag className="text-lg font-semibold text-white leading-snug">
            {serviceName || 'Booking'}
          </TitleTag>
          <p className="text-sm text-gray-400 mt-0.5 tabular-nums italic">
            {formatDurationMinutes(serviceDurationMinutes)}
          </p>
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
                      + {formatDurationMinutes(addOn.durationMinutes)}
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
              {formatDurationMinutes(totalBookingDurationMinutes)}
            </p>
            {totalPriceCents != null && totalPriceCents > 0 ? (
              <span className="text-base font-semibold text-white tabular-nums shrink-0 text-right min-w-[4.5rem]">
                ${(totalPriceCents / 100).toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
