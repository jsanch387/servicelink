import { Button } from '@/components/shared';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface SyncBookingsCtaCardProps {
  onSyncClick: () => void;
  /** `header`: same row as page title, right-aligned; `default`: standalone row */
  variant?: 'default' | 'header';
  className?: string;
}

export function SyncBookingsCtaCard({
  onSyncClick,
  variant = 'default',
  className = '',
}: SyncBookingsCtaCardProps) {
  if (variant === 'header') {
    return (
      <div className={`shrink-0 self-start pt-0.5 sm:pt-1 ${className}`.trim()}>
        <button
          type="button"
          onClick={onSyncClick}
          className="-mr-1 inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-left font-normal text-xs text-gray-400 underline-offset-2 transition-colors hover:text-gray-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] sm:text-sm"
          aria-label="Add all confirmed appointments to your calendar"
          title="Adds all confirmed appointments to your phone calendar."
        >
          <CalendarDaysIcon
            className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4"
            aria-hidden
          />
          Add to calendar
        </button>
      </div>
    );
  }

  return (
    <section className={`mb-2 ${className}`.trim()}>
      <div className="flex items-center justify-start sm:justify-end">
        <Button
          variant="ghost"
          size="xs"
          className="-ml-1 !font-normal text-gray-400 hover:text-gray-200"
          icon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}
          onClick={onSyncClick}
          aria-label="Add all confirmed appointments to your calendar"
          title="Adds all confirmed appointments to your phone calendar."
        >
          Add to calendar
        </Button>
      </div>
    </section>
  );
}
