'use client';

import { Button } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatBookingWallTime } from '../utils/formatBookingWallTime';

interface QuickScheduleCardProps {
  date: Date;
  time: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  onBookThisTime: () => void;
  onChooseDifferentTime: () => void;
  labels: {
    nextAvailableLabel: string;
    bookThisTime: string;
    chooseDifferentTime: string;
  };
}

/**
 * "First available, let's take it" one-tap card shown above the full
 * calendar. Lets most customers skip picking a date and time entirely.
 */
export function QuickScheduleCard({
  date,
  time,
  bookingFlowLocale = 'en',
  onBookThisTime,
  onChooseDifferentTime,
  labels,
}: QuickScheduleCardProps) {
  const dateFormatted = date.toLocaleDateString(
    bcp47ForBookingLocale(bookingFlowLocale),
    { weekday: 'long', month: 'long', day: 'numeric' }
  );
  const timeFormatted = formatBookingWallTime(time, bookingFlowLocale);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"
          aria-hidden
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
            {labels.nextAvailableLabel}
          </p>
          <p className="mt-1 text-lg font-semibold text-white tracking-tight sm:text-xl">
            {dateFormatted}
          </p>
          <p className="text-sm text-gray-400">{timeFormatted}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <Button
          type="button"
          variant="inverse"
          fullWidth
          className="font-semibold"
          onClick={onBookThisTime}
        >
          {labels.bookThisTime}
        </Button>
        <button
          type="button"
          onClick={onChooseDifferentTime}
          className="w-full cursor-pointer rounded-lg py-2 text-center text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          {labels.chooseDifferentTime}
        </button>
      </div>
    </div>
  );
}
