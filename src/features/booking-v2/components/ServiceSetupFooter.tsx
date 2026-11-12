'use client';

import { Button } from '@/components/shared';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { formatSetupDollars } from '../utils/formatSetupMoney';

export function ServiceSetupFooter({
  dueCents,
  originalCents,
  durationMinutes,
  offLabel,
  canAdd,
  onAdd,
  actionLabel,
  bookingFlowLocale,
}: {
  dueCents: number;
  originalCents: number;
  durationMinutes: number;
  offLabel: string | null;
  canAdd: boolean;
  onAdd: () => void;
  actionLabel?: string;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const showOriginal = originalCents > dueCents;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-[#0F0F0F]">
      <div
        className={`${bookingV2ColumnClass} flex items-center justify-between gap-4 border-t border-[#222222] px-5 pb-[max(34px,env(safe-area-inset-bottom))] pt-3.5`}
      >
        <div className="min-w-0">
          <p className="flex items-baseline gap-2">
            <span className="text-[20px] font-bold tabular-nums text-white">
              {formatSetupDollars(dueCents)}
            </span>
            {showOriginal ? (
              <span className="text-[13px] font-normal tabular-nums text-[#8F8F8F] line-through">
                {formatSetupDollars(originalCents)}
              </span>
            ) : null}
          </p>
          <p className="text-[13px] font-normal text-[#8F8F8F]">
            {formatDurationMinutes(durationMinutes, bookingFlowLocale)}
            {offLabel ? (
              <>
                {' · '}
                <span className="text-[#3DDC6A]">{offLabel}</span>
              </>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onAdd}
          disabled={!canAdd}
          className="shrink-0"
        >
          {actionLabel ?? ui.addToBooking}
        </Button>
      </div>
    </div>
  );
}
