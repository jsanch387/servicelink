'use client';

export type BookingsLayoutMode = 'list' | 'planner';

export interface BookingsViewModeToggleProps {
  value: BookingsLayoutMode;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: BookingsLayoutMode) => void;
  className?: string;
}

const OPTIONS: { id: BookingsLayoutMode; label: string; title: string }[] = [
  { id: 'list', label: 'List', title: 'List view' },
  { id: 'planner', label: 'Planner', title: 'Day planner' },
];

export function BookingsViewModeToggle({
  value,
  onChange,
  className = '',
}: BookingsViewModeToggleProps) {
  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Booking view"
        className="inline-flex items-center rounded-xl border border-white/[0.09] bg-white/[0.04] p-0.5 sm:p-1 gap-px sm:gap-0.5"
      >
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            title={opt.title}
            aria-selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={`inline-flex min-h-10 min-w-[4.25rem] sm:min-w-[4.75rem] items-center justify-center rounded-[10px] px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer whitespace-nowrap ${
              value === opt.id
                ? 'bg-white text-black'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
