'use client';

import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

function formatDateRowLabel(iso: string): string {
  const t = iso.trim();
  if (!t) return 'Choose date';
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRowLabel(hhmm: string): string {
  const s = hhmm.trim().slice(0, 5);
  if (!s) return 'Choose time';
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return s;
  const h = parseInt(m[1]!, 10);
  const min = m[2]!;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${ampm}`;
}

const rowShell =
  'relative min-h-[48px] w-full rounded-lg border border-white/10 bg-white/5 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20 lg:rounded-xl';

const inputOverlay =
  'absolute inset-0 z-20 min-h-[48px] w-full cursor-pointer border-0 bg-transparent p-0 text-base opacity-0';

const fauxRow =
  'pointer-events-none absolute inset-0 z-10 flex min-h-[48px] items-center gap-2.5 px-3.5';

export type NativeScheduleDateRowProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
};

/**
 * Native `<input type="date">` with a visible row + calendar icon. The real
 * input covers the row at full size (opacity 0) so iOS Safari opens the system
 * picker reliably instead of styling broken inline chrome.
 */
export function NativeScheduleDateRow({
  id,
  value,
  onChange,
  'aria-label': ariaLabel,
}: NativeScheduleDateRowProps) {
  return (
    <div className={rowShell}>
      <div className={fauxRow} aria-hidden>
        <CalendarDaysIcon className="h-5 w-5 shrink-0 text-white" />
        <span
          className={`min-w-0 truncate text-base font-medium ${value ? 'text-white' : 'text-gray-500'}`}
        >
          {formatDateRowLabel(value)}
        </span>
      </div>
      <input
        id={id}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        aria-label={ariaLabel}
        className={inputOverlay}
      />
    </div>
  );
}

export type NativeScheduleTimeRowProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
};

/**
 * Native `<input type="time">` with visible row + clock icon (same tap target
 * pattern as {@link NativeScheduleDateRow}).
 */
export function NativeScheduleTimeRow({
  id,
  value,
  onChange,
  'aria-label': ariaLabel,
}: NativeScheduleTimeRowProps) {
  return (
    <div className={rowShell}>
      <div className={fauxRow} aria-hidden>
        <ClockIcon className="h-5 w-5 shrink-0 text-white" />
        <span
          className={`min-w-0 truncate text-base font-medium ${value ? 'text-white' : 'text-gray-500'}`}
        >
          {formatTimeRowLabel(value)}
        </span>
      </div>
      <input
        id={id}
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        aria-label={ariaLabel}
        className={inputOverlay}
      />
    </div>
  );
}
