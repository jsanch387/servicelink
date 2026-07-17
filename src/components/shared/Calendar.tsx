'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 1).getDay();
}

export interface CalendarProps {
  /** Currently selected date (controlled). */
  value: Date | null;
  /** Called when user selects a date. */
  onChange: (date: Date) => void;
  /** Minimum selectable date (e.g. today). */
  minDate?: Date;
  /** Maximum selectable date. */
  maxDate?: Date;
  /** Optional: disable specific dates (e.g. by schedule). Return true to disable. */
  isDateDisabled?: (date: Date) => boolean;
  /** Optional title above the calendar. */
  title?: string;
  /** Optional subtitle/description. */
  subtitle?: string;
  /** Extra class for the container. */
  className?: string;
  /** Show year under month in header. Default true. */
  showYear?: boolean;
  /** Locale used for the month label. */
  locale?: string;
  /** Allow the framed calendar to fill its parent on larger screens. */
  wide?: boolean;
  /** No outer card frame (border, shadow, panel fill) — for embedding in a larger layout. */
  plain?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  isDateDisabled,
  title,
  subtitle,
  className = '',
  showYear = true,
  locale,
  wide = false,
  plain = false,
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    const initialDate = value ?? minDate ?? today;
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  useEffect(() => {
    if (!value) return;
    setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value]);

  const minDay = minDate
    ? new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate()
      ).getTime()
    : null;
  const maxDay = maxDate
    ? new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate()
      ).getTime()
    : null;

  const { days, firstDay } = useMemo(() => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { days, firstDay };
  }, [month, year]);

  const isDateSelectable = (d: number): boolean => {
    const date = new Date(year, month, d);
    const day = date.getTime();
    if (minDay != null && day < minDay) return false;
    if (maxDay != null && day > maxDay) return false;
    if (isDateDisabled?.(date)) return false;
    return true;
  };

  const isSelected = (d: number): boolean =>
    value != null &&
    value.getDate() === d &&
    value.getMonth() === month &&
    value.getFullYear() === year;

  const isToday = (d: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const prevMonth = () => {
    if (isPreviousMonthDisabled) return;
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    if (isNextMonthDisabled) return;
    setViewDate(new Date(year, month + 1, 1));
  };

  const currentMonthIndex = year * 12 + month;
  const minMonthIndex = minDate
    ? minDate.getFullYear() * 12 + minDate.getMonth()
    : null;
  const maxMonthIndex = maxDate
    ? maxDate.getFullYear() * 12 + maxDate.getMonth()
    : null;
  const isPreviousMonthDisabled =
    minMonthIndex != null && currentMonthIndex <= minMonthIndex;
  const isNextMonthDisabled =
    maxMonthIndex != null && currentMonthIndex >= maxMonthIndex;

  const monthLabel = new Date(year, month, 1).toLocaleString(locale, {
    month: 'long',
  });

  const frameClass = plain
    ? 'w-full sm:max-w-[360px] p-0 bg-transparent border-0 shadow-none rounded-none'
    : `w-full ${
        wide ? 'sm:max-w-none' : 'sm:max-w-[360px]'
      } rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 shadow-xl`;

  return (
    <div className={`${frameClass} transition-all duration-300 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6 px-0.5">
          {title && (
            <h2 className="text-xl font-semibold text-white tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 font-medium tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Centered month navigation */}
      <div className="mb-6 grid grid-cols-[44px_1fr_44px] items-center gap-3">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isPreviousMonthDisabled}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.02] disabled:text-gray-700"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h3
          className="text-center text-lg font-semibold tracking-tight text-gray-100"
          aria-live="polite"
        >
          {monthLabel}
          {showYear ? (
            <span className="ml-1.5 font-normal text-gray-500">{year}</span>
          ) : null}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          disabled={isNextMonthDisabled}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.02] disabled:text-gray-700"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday labels – single letter */}
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {WEEKDAY_LABELS.map(day => (
          <span
            key={day}
            className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            {day[0]}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {Array(firstDay)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} className="h-11" />
          ))}
        {days.map(d => {
          const selectable = isDateSelectable(d);
          const selected = isSelected(d);
          const today = isToday(d);

          return (
            <button
              key={d}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onChange(new Date(year, month, d))}
              className={`
                relative mx-auto flex h-11 w-11 max-w-full items-center justify-center rounded-xl text-[15px] font-medium transition-all duration-200
                ${!selectable ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
                ${selected ? 'bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.12)] scale-105 z-10' : ''}
                ${!selected && selectable && today ? 'text-white border border-white/20' : ''}
                ${!selected && selectable && !today ? 'text-white hover:bg-white/10' : ''}
              `}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};
