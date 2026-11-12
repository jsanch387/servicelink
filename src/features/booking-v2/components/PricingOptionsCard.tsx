'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { PriceOptionForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { formatSetupDollars } from '../utils/formatSetupMoney';

export function PricingOptionsCard({
  options,
  selectedId,
  onSelect,
  bookingFlowLocale,
}: {
  options: PriceOptionForBooking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;

  return (
    <section>
      <h2 className="mb-2.5 text-[17px] font-bold text-white">
        {ui.pricingOptions}
      </h2>
      <div
        role="radiogroup"
        aria-label={ui.pricingOptions}
        className="overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]"
      >
        {options.map((option, index) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(option.id)}
              className={`flex min-h-[60px] w-full cursor-pointer items-center gap-3.5 px-4 text-left ${
                selected ? 'bg-[#202020]' : ''
              } ${index > 0 ? 'border-t border-[#262626]' : ''}`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                  selected
                    ? 'border-2 border-white'
                    : 'border-[1.5px] border-[#4A4A4A]'
                }`}
                aria-hidden
              >
                {selected ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-5 text-white">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[13px] font-normal leading-4 text-[#8F8F8F]">
                  {formatDurationMinutes(
                    option.durationMinutes,
                    bookingFlowLocale
                  )}
                </span>
              </span>
              <span className="shrink-0 text-[16px] font-semibold tabular-nums text-white">
                {formatSetupDollars(option.priceCents)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
