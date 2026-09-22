'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { BlockTimeEntry } from '@/features/availability/types/blockTime';
import type { BookingAssigneeOption } from '@/features/team/types/bookingAssignee';
import { localDateKey } from '../dayPlannerUtils';
import type { BookingsStatusFilterValue } from '../BookingsStatusFilter';
import type { AvailabilityBookingDisplay } from '../types';
import { CalendarDayView } from './CalendarDayView';
import { CalendarListView } from './CalendarListView';
import { CalendarMonthView } from './CalendarMonthView';
import {
  CalendarListSkeleton,
  CalendarRangeSkeleton,
} from './CalendarSkeletons';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarWeekView } from './CalendarWeekView';
import {
  formatDayTitle,
  formatMonthTitle,
  isCursorOnToday,
  monthGridKeys,
  weekKeys,
} from './dateUtils';
import { mapBookingsToCalendarEvents } from './mapBookingsToEvents';
import { mapTimeOffToCalendarEvents } from './mapTimeOffToEvents';
import { shiftCalendarCursor } from './shiftCalendarCursor';
import type { CalendarEvent, CalendarMode, CalendarRange } from './types';

function subscribeWideViewport(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(min-width: 640px)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function isWideViewport(): boolean {
  return window.matchMedia('(min-width: 640px)').matches;
}

interface BookingsCalendarProps {
  bookings: AvailabilityBookingDisplay[];
  onSelectBooking: (booking: AvailabilityBookingDisplay) => void;
  mode?: CalendarMode;
  onModeChange?: (mode: CalendarMode) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onListActive?: () => void;
  onVisibleRangeChange?: (from: string, to: string) => void;
  onLoadMore?: () => void;
  listFilter?: BookingsStatusFilterValue;
  assignedToMe?: boolean;
  assigneeOptions?: BookingAssigneeOption[];
  timeOffBlocks?: BlockTimeEntry[];
}

export function BookingsCalendar({
  bookings,
  onSelectBooking,
  mode: modeProp,
  onModeChange,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onListActive,
  onVisibleRangeChange,
  onLoadMore,
  listFilter = 'upcoming',
  assignedToMe = false,
  assigneeOptions = [],
  timeOffBlocks = [],
}: BookingsCalendarProps) {
  const todayKey = localDateKey(new Date());
  const isDesktop = useSyncExternalStore(
    subscribeWideViewport,
    isWideViewport,
    () => false
  );
  const userPickedRange = useRef(false);
  const [internalMode, setInternalMode] = useState<CalendarMode>('list');
  const mode = modeProp ?? internalMode;
  const setMode = onModeChange ?? setInternalMode;
  const [cursor, setCursor] = useState(todayKey);
  const [range, setRange] = useState<CalendarRange>('day');

  const visibleKeys = useMemo(() => {
    if (mode === 'list') return null;
    if (range === 'day') return [cursor];
    if (range === 'week') return weekKeys(cursor);
    return monthGridKeys(cursor);
  }, [cursor, mode, range]);

  const visibleEvents = useMemo(() => {
    const bookingEvents = isLoading
      ? []
      : mapBookingsToCalendarEvents(bookings, assigneeOptions);
    const timeOffEvents =
      mode === 'list' || !visibleKeys?.length
        ? []
        : mapTimeOffToCalendarEvents(timeOffBlocks, visibleKeys);
    if (!visibleKeys) return bookingEvents;
    const keys = new Set(visibleKeys);
    return [
      ...timeOffEvents,
      ...bookingEvents.filter(event => keys.has(event.dateKey)),
    ];
  }, [assigneeOptions, bookings, isLoading, mode, timeOffBlocks, visibleKeys]);

  useEffect(() => {
    if (mode === 'list' || userPickedRange.current) return;
    const preferred = isDesktop ? 'month' : 'day';
    if (preferred !== range) {
      setRange(preferred);
    }
  }, [isDesktop, mode, range]);

  useEffect(() => {
    if (mode !== 'list') return;
    onListActive?.();
  }, [mode, onListActive]);

  useEffect(() => {
    if (mode === 'list' || !visibleKeys?.length) return;
    const from = visibleKeys[0];
    const to = visibleKeys[visibleKeys.length - 1];
    if (!from || !to) return;
    onVisibleRangeChange?.(from, to);
  }, [mode, onVisibleRangeChange, visibleKeys]);

  const title =
    range === 'day'
      ? formatDayTitle(cursor, !isDesktop)
      : formatMonthTitle(cursor);

  const handleRangeChange = (next: CalendarRange) => {
    userPickedRange.current = true;
    setRange(next);
  };

  const handleSelectDay = (dateKey: string) => {
    userPickedRange.current = true;
    setCursor(dateKey);
    setRange('day');
    setMode('calendar');
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (!event.booking) return;
    onSelectBooking(event.booking);
  };

  return (
    <div className="space-y-4">
      {mode === 'list' ? (
        isLoading ? (
          <CalendarListSkeleton />
        ) : (
          <CalendarListView
            events={visibleEvents}
            onSelectEvent={handleSelectEvent}
            filter={listFilter}
            assignedToMe={assignedToMe}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        )
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3.5 backdrop-blur-md sm:p-5">
          <CalendarToolbar
            title={title}
            range={range}
            isToday={isCursorOnToday(cursor, range, todayKey)}
            onRangeChange={handleRangeChange}
            onPrev={() =>
              setCursor(current => shiftCalendarCursor(current, range, -1))
            }
            onNext={() =>
              setCursor(current => shiftCalendarCursor(current, range, 1))
            }
            onToday={() => setCursor(todayKey)}
          />
          <div className="mt-4 sm:mt-5">
            {isLoading ? (
              <CalendarRangeSkeleton />
            ) : range === 'day' ? (
              <CalendarDayView
                dateKey={cursor}
                events={visibleEvents}
                onSelectEvent={handleSelectEvent}
              />
            ) : range === 'week' ? (
              <CalendarWeekView
                weekKeys={weekKeys(cursor)}
                events={visibleEvents}
                onSelectDay={handleSelectDay}
                onSelectEvent={handleSelectEvent}
              />
            ) : (
              <CalendarMonthView
                monthKey={cursor}
                gridKeys={monthGridKeys(cursor)}
                events={visibleEvents}
                onSelectDay={handleSelectDay}
                onSelectEvent={handleSelectEvent}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
