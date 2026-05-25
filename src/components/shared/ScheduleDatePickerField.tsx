'use client';

import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useId, useMemo, useState } from 'react';
import { Calendar } from './Calendar';

function formatScheduleDateLabel(iso: string, placeholder: string): string {
  const t = iso.trim();
  if (!t) return placeholder;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isoFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localDateFromIso(iso: string): Date | null {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const triggerShell =
  'flex min-h-[48px] w-full min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3.5 text-left transition-colors hover:border-white/20 focus-visible:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:rounded-xl';

export type ScheduleDatePickerFieldProps = {
  id?: string;
  /** `YYYY-MM-DD` or empty. */
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: Date;
  /** Same semantics as shared `Calendar` (e.g. no open slots that day). */
  isDateDisabled?: (date: Date) => boolean;
  placeholder?: string;
  'aria-label'?: string;
  /** When true, calendar panel starts expanded. */
  defaultOpen?: boolean;
};

/**
 * Booking-style date field: icon row toggles a card-wrapped shared `Calendar`.
 * Click the row again to collapse.
 */
export function ScheduleDatePickerField({
  id,
  value,
  onChange,
  minDate,
  isDateDisabled,
  placeholder = 'Choose date',
  'aria-label': ariaLabel = 'Choose date',
  defaultOpen = false,
}: ScheduleDatePickerFieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const selectedDate = useMemo(() => localDateFromIso(value), [value]);
  const label = formatScheduleDateLabel(value, placeholder);

  return (
    <div className="min-w-0">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen(prev => !prev)}
        className={triggerShell}
      >
        <CalendarDaysIcon className="h-5 w-5 shrink-0 text-white" aria-hidden />
        <span
          className={`min-w-0 flex-1 truncate text-base font-medium ${value ? 'text-white' : 'text-gray-500'}`}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="mt-3 min-w-0">
          <Calendar
            value={selectedDate}
            onChange={date => onChange(isoFromLocalDate(date))}
            minDate={minDate}
            isDateDisabled={isDateDisabled}
          />
        </div>
      ) : null}
    </div>
  );
}
