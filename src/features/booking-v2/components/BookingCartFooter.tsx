'use client';

import { Button } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { formatCartDollars } from '../utils/formatCartMoney';

export function BookingCartFooter({
  dueCents,
  durationMinutes,
  offLabel,
  canContinue,
  onPickTime,
  actionLabel,
  bookingFlowLocale,
}: {
  dueCents: number;
  durationMinutes: number;
  offLabel: string | null;
  canContinue: boolean;
  onPickTime: () => void;
  actionLabel?: string;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-[#0F0F0F]">
      <div
        className={`${bookingV2ColumnClass} flex items-center justify-between gap-4 border-t border-[#222222] px-5 pb-[max(34px,env(safe-area-inset-bottom))] pt-3.5`}
      >
        <div className="min-w-0">
          <p className="text-[20px] font-bold tabular-nums text-white">
            {formatCartDollars(dueCents)}
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
          disabled={!canContinue}
          onClick={onPickTime}
          className="shrink-0"
        >
          {actionLabel ?? ui.pickATime}
        </Button>
      </div>
    </div>
  );
}
