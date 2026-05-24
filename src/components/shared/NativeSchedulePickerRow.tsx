'use client';

import { CalendarDaysIcon } from '@heroicons/react/24/outline';

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

const rowShell =
  'relative flex h-12 min-h-[48px] w-full min-w-0 max-w-full items-center overflow-hidden rounded-lg border border-white/10 bg-white/5 px-3.5 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20 lg:rounded-xl [color-scheme:dark]';

export type NativeScheduleDateRowProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
  min?: string;
};

/**
 * Visible native `<input type="date">` with calendar icon. Avoids opacity-0 overlays
 * that fail inside modals (overflow clipping, dead clicks on desktop).
 */
export function NativeScheduleDateRow({
  id,
  value,
  onChange,
  'aria-label': ariaLabel,
  min,
}: NativeScheduleDateRowProps) {
  return (
    <div className={rowShell}>
      <CalendarDaysIcon
        className="pointer-events-none mr-2.5 h-5 w-5 shrink-0 text-white"
        aria-hidden
      />
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        aria-label={ariaLabel}
        className="
          min-h-0 min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-0
          text-base font-medium text-white shadow-none outline-none ring-0
          focus:outline-none focus:ring-0
          [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:shrink-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          [&::-webkit-datetime-edit-fields-wrapper]:min-w-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0
        "
      />
      {!value ? (
        <span className="pointer-events-none absolute left-11 text-base font-medium text-gray-500">
          {formatDateRowLabel('')}
        </span>
      ) : null}
    </div>
  );
}
