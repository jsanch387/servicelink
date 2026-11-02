'use client';

import { CalendarModeToggle } from './CalendarModeToggle';
import type { CalendarMode } from './types';

interface CalendarModeDockProps {
  value: CalendarMode;
  onChange: (value: CalendarMode) => void;
  /** Sit above the New appointment bar. */
  raised?: boolean;
}

export function CalendarModeDock({
  value,
  onChange,
  raised = false,
}: CalendarModeDockProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center dashboard-sidebar-offset ${
        raised
          ? 'bottom-[calc(8rem+env(safe-area-inset-bottom))]'
          : 'bottom-[max(3rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="pointer-events-auto">
        <CalendarModeToggle value={value} onChange={onChange} />
      </div>
    </div>
  );
}
