'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { AvailabilityBookingCard } from '../AvailabilityBookingCard';
import { formatDayGroupLabel } from '../dayPlannerUtils';
import type { BookingsStatusFilterValue } from '../BookingsStatusFilter';
import { groupEventsByDate } from './layoutEvents';
import { sortCalendarListEvents } from './listPagination';
import { CALENDAR_LIST_COLUMN_CLASS, type CalendarEvent } from './types';

interface CalendarListViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  filter?: BookingsStatusFilterValue;
  assignedToMe?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function emptyHint(
  filter: BookingsStatusFilterValue,
  assignedToMe: boolean
): string {
  if (assignedToMe && filter === 'past') {
    return 'No past appointments assigned to you.';
  }
  if (assignedToMe && filter === 'cancelled') {
    return 'No cancelled bookings assigned to you.';
  }
  if (assignedToMe) return 'No appointments assigned to you.';
  if (filter === 'past') return 'No past appointments.';
  if (filter === 'cancelled') return 'No cancelled bookings.';
  return 'No upcoming appointments.';
}

export function CalendarListView({
  events,
  onSelectEvent,
  filter = 'upcoming',
  assignedToMe = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: CalendarListViewProps) {
  const sortDirection = filter === 'upcoming' ? 'asc' : 'desc';
  const grouped = useMemo(() => {
    const dayDir = sortDirection === 'asc' ? 1 : -1;
    return [
      ...groupEventsByDate(
        sortCalendarListEvents(events, sortDirection)
      ).entries(),
    ]
      .sort(([left], [right]) => left.localeCompare(right) * dayDir)
      .map(([dateKey, dayEvents]) => ({
        dateKey,
        dayEvents: [...dayEvents].sort(
          (left, right) => (left.startMin - right.startMin) * dayDir
        ),
      }));
  }, [events, sortDirection]);

  if (grouped.length === 0) {
    return (
      <div
        className={`${CALENDAR_LIST_COLUMN_CLASS} flex flex-col items-center justify-center py-20 text-center`}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05]">
          <CalendarIcon className="h-8 w-8 text-gray-600" />
        </div>
        <h3 className="font-bold text-gray-400">No bookings</h3>
        <p className="mt-1 text-sm text-gray-500">
          {emptyHint(filter, assignedToMe)}
        </p>
      </div>
    );
  }

  return (
    <div className={`${CALENDAR_LIST_COLUMN_CLASS} space-y-6 sm:space-y-7`}>
      {grouped.map(({ dateKey, dayEvents }) => (
        <section key={dateKey} aria-labelledby={`bookings-day-${dateKey}`}>
          <h2
            id={`bookings-day-${dateKey}`}
            className="mb-3 text-sm font-bold tracking-tight text-gray-400 sm:text-base"
          >
            {formatDayGroupLabel(dateKey)}
          </h2>
          <div className="space-y-3">
            {dayEvents.map(event =>
              event.booking ? (
                <AvailabilityBookingCard
                  key={event.id}
                  booking={event.booking}
                  assigneeLabel={event.assigneeLabel}
                  onClick={() => onSelectEvent(event)}
                />
              ) : null
            )}
          </div>
        </section>
      ))}
      {hasMore && onLoadMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
