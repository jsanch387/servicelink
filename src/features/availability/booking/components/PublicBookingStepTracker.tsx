'use client';

/**
 * Slim progress indicator for the public booking funnel.
 * Four fixed stages regardless of how many sub-screens each stage collapses
 * internally (service picker + options/add-ons both count as "service", etc).
 */

export type PublicBookingTrackerStage =
  | 'service'
  | 'time'
  | 'details'
  | 'confirm';

const STAGE_ORDER: PublicBookingTrackerStage[] = [
  'service',
  'time',
  'details',
  'confirm',
];

interface PublicBookingStepTrackerProps {
  currentStage: PublicBookingTrackerStage;
  labels: Record<PublicBookingTrackerStage, string>;
}

export function PublicBookingStepTracker({
  currentStage,
  labels,
}: PublicBookingStepTrackerProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="mb-6" aria-hidden={false}>
      <ol
        className="flex items-center gap-1.5"
        role="list"
        aria-label={labels[currentStage]}
      >
        {STAGE_ORDER.map((stage, index) => (
          <li
            key={stage}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              index <= currentIndex ? 'bg-white' : 'bg-white/10'
            }`}
          />
        ))}
      </ol>
      <div className="mt-2 flex items-center justify-between">
        {STAGE_ORDER.map((stage, index) => (
          <span
            key={stage}
            className={`text-[10px] font-semibold uppercase tracking-wide transition-colors sm:text-[11px] ${
              index === currentIndex
                ? 'text-white'
                : index < currentIndex
                  ? 'text-zinc-400'
                  : 'text-zinc-600'
            }`}
          >
            {labels[stage]}
          </span>
        ))}
      </div>
    </div>
  );
}
