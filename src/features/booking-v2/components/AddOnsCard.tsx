'use client';

import type { AddOnForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { formatAddedDuration } from '../utils/formatAddedDuration';
import { formatSetupAddonPrice } from '../utils/formatSetupMoney';

export function AddOnsCard({
  addOns,
  selectedIds,
  onToggle,
  bookingFlowLocale,
}: {
  addOns: AddOnForBooking[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const [openDescriptionId, setOpenDescriptionId] = useState<string | null>(
    null
  );
  const selected = new Set(selectedIds);

  return (
    <section>
      <h2 className="mb-2.5 flex items-baseline gap-2 text-[17px] font-bold text-white">
        {ui.addOns}
        <span className="text-[14px] font-normal text-[#8F8F8F]">
          {ui.optional}
        </span>
      </h2>
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
        {addOns.map((addOn, index) => {
          const checked = selected.has(addOn.id);
          const extraTime = formatAddedDuration(
            addOn.durationMinutes,
            bookingFlowLocale
          );
          const description = addOn.description?.trim() ?? '';
          const descriptionOpen = openDescriptionId === addOn.id;

          const showMeta = Boolean(extraTime || description);

          return (
            <div
              key={addOn.id}
              className={`flex items-start gap-3.5 px-4 py-3 ${
                checked ? 'bg-[#202020]' : ''
              } ${index > 0 ? 'border-t border-[#262626]' : ''} ${
                showMeta ? '' : 'min-h-[60px] items-center'
              }`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={addOn.name}
                onClick={() => onToggle(addOn.id)}
                className={`flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-[7px] ${
                  showMeta ? 'mt-0.5' : ''
                } ${checked ? 'bg-white' : 'border-[1.5px] border-[#4A4A4A]'}`}
              >
                {checked ? (
                  <CheckIcon className="h-3.5 w-3.5 text-[#0F0F0F]" />
                ) : null}
              </button>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggle(addOn.id)}
                  className="flex w-full cursor-pointer items-start gap-3 text-left"
                >
                  <span className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-white">
                    {addOn.name}
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold tabular-nums text-white">
                    {formatSetupAddonPrice(addOn.priceCents)}
                  </span>
                </button>
                {showMeta ? (
                  <p className="mt-1.5 text-[13px] font-normal leading-4 text-[#8F8F8F]">
                    {extraTime}
                    {extraTime && description ? ' · ' : null}
                    {description ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDescriptionId(current =>
                            current === addOn.id ? null : addOn.id
                          )
                        }
                        className="cursor-pointer underline"
                        aria-expanded={descriptionOpen}
                      >
                        {descriptionOpen
                          ? ui.hideDescription
                          : ui.viewDescription}
                      </button>
                    ) : null}
                  </p>
                ) : null}
                {descriptionOpen ? (
                  <p className="mt-1.5 text-[13px] font-normal leading-[1.45] text-[#A3A3A3]">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
