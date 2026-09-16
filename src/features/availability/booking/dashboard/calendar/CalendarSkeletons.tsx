import { AvailabilityBookingCardSkeleton } from '../AvailabilityBookingCardSkeleton';
import { CALENDAR_LIST_COLUMN_CLASS } from './types';

export function CalendarListSkeleton() {
  return (
    <div className={`${CALENDAR_LIST_COLUMN_CLASS} space-y-3`} aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <AvailabilityBookingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CalendarRangeSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="mt-2 h-3 w-10 shrink-0 rounded bg-white/10" />
          <div className="h-14 flex-1 rounded-xl bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
