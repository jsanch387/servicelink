'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

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
}) => {
  const [viewDate, setViewDate] = useState(() => new Date());

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const minDateStr = minDate?.toISOString().slice(0, 10) ?? '';
  const maxDateStr = maxDate?.toISOString().slice(0, 10) ?? '';

  const { days, firstDay } = useMemo(() => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { days, firstDay };
  }, [month, year]);

  const isDateSelectable = (d: number): boolean => {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    if (minDateStr && dateStr < minDateStr) return false;
    if (maxDateStr && dateStr > maxDateStr) return false;
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
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const monthLabel = new Date(year, month, 1).toLocaleString('default', {
    month: 'long',
  });

  return (
    <div
      className={`w-full sm:max-w-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 shadow-xl transition-all duration-300 ${className}`}
    >
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

      {/* Header: month + year, prev/next */}
      <div className="flex items-center justify-between mb-6 px-0.5">
        <div>
          <h3 className="text-xl font-bold text-gray-100 tracking-tight">
            {monthLabel}
          </h3>
          {showYear && (
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
              {year}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday labels – single letter */}
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {WEEKDAY_LABELS.map(day => (
          <span
            key={day}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
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
            <div key={`empty-${i}`} className="aspect-square" />
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
                relative aspect-square w-full min-h-[44px] flex items-center justify-center rounded-2xl text-[15px] font-medium transition-all duration-200
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
