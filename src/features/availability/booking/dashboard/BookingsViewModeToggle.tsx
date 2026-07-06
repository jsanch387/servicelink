'use client';

export type BookingsLayoutMode = 'list' | 'planner';

export interface BookingsViewModeToggleProps {
  value: BookingsLayoutMode;

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
        className="inline-flex items-center gap-0.5 rounded-lg border border-white/[0.09] bg-white/[0.04] p-0.5"
      >
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            title={opt.title}
            aria-selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={`inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded-md px-2.5 text-[11px] font-semibold tracking-tight transition-colors cursor-pointer whitespace-nowrap sm:min-w-[3.75rem] sm:text-xs ${
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
