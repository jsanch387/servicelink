'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useMemo } from 'react';
import { formatBookingMonth } from '../utils/formatBookingTime';

export function BookingTimeCalendar({
  visibleMonth,
  selectedYmd,
  isDayOpen,
  canGoBack,
  bookingFlowLocale,
  previousMonthLabel,
  nextMonthLabel,
  onVisibleMonth,
  onSelectDay,
}: {
  visibleMonth: Date;
  selectedYmd: string | null;
  isDayOpen: (date: Date) => boolean;
  canGoBack: boolean;
  bookingFlowLocale: PublicBookingFlowLocale;
  previousMonthLabel: string;
  nextMonthLabel: string;
  onVisibleMonth: (next: Date) => void;
  onSelectDay: (date: Date) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const weekdays = useMemo(() => {
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return new Intl.DateTimeFormat(bcp47ForBookingLocale(bookingFlowLocale), {
        weekday: 'narrow',
      }).format(date);
    });
  }, [bookingFlowLocale]);
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = Array.from({ length: firstWeekday }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...leading, ...days];
  }, [year, month]);

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#181818] px-3 py-4">
      <div className="grid grid-cols-[36px_1fr_36px] items-center">
        <button
          type="button"
          aria-label={previousMonthLabel}
          disabled={!canGoBack}
          onClick={() => onVisibleMonth(new Date(year, month - 1, 1))}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>
        <p className="text-center text-[16px] font-semibold text-white">
          {formatBookingMonth(visibleMonth, bookingFlowLocale)}
        </p>
        <button
          type="button"
          aria-label={nextMonthLabel}
          onClick={() => onVisibleMonth(new Date(year, month + 1, 1))}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center justify-self-end text-white"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center">
        {weekdays.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="flex h-10 items-center justify-center text-[12px] font-medium text-[#8F8F8F]"
          >
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day == null)
            return <span key={`pad-${index}`} className="h-12" />;
          const date = new Date(year, month, day);
          const ymd = [
            year,
            String(month + 1).padStart(2, '0'),
            String(day).padStart(2, '0'),
          ].join('-');
          const open = isDayOpen(date);
          const selected = ymd === selectedYmd;
          return (
            <button
              key={ymd}
              type="button"
              disabled={!open}
              onClick={() => onSelectDay(date)}
              className={`flex h-12 items-center justify-center text-[15px] ${
                open ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  selected
                    ? 'bg-white font-semibold text-black'
                    : open
                      ? 'font-medium text-white hover:bg-white/10'
                      : 'font-medium text-[#3A3A3A]'
                }`}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
