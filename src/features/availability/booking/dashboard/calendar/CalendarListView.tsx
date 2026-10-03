'use client';

import {
  ListPagination,
  StatusPill,
  type StatusPillTone,
} from '@/components/shared';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { Fragment, useMemo, type KeyboardEvent } from 'react';
import { formatDayGroupLabel } from '../dayPlannerUtils';
import type { AvailabilityBookingDisplay } from '../types';
import type { BookingsStatusFilterValue } from '../BookingsStatusFilter';
import { bookingListServiceTitle } from '../utils/bookingCardServiceTitle';
import { formatListCardTimeForBooking } from '../utils/formatListCardTime';
import { groupEventsByDate } from './layoutEvents';
import { sortCalendarListEvents } from './listPagination';
import type { CalendarEvent } from './types';

interface CalendarListViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  filter?: BookingsStatusFilterValue;
  assignedToMe?: boolean;
  /** Shop has teammates, so the list can show who the job is assigned to. */
  showAssignee?: boolean;
  page?: number;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  onPageChange?: (page: number) => void;
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

function statusLabel(status: AvailabilityBookingDisplay['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Confirmed';
}

function statusTone(
  status: AvailabilityBookingDisplay['status']
): StatusPillTone {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'info';
}

function BookingStatusPill({
  status,
}: {
  status: AvailabilityBookingDisplay['status'];
}) {
  return (
    <StatusPill tone={statusTone(status)}>{statusLabel(status)}</StatusPill>
  );
}

function openOnKey(event: KeyboardEvent, onOpen: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpen();
  }
}

export function CalendarListView({
  events,
  onSelectEvent,
  filter = 'upcoming',
  assignedToMe = false,
  showAssignee = false,
  page = 0,
  hasNextPage = false,
  isLoadingMore = false,
  onPageChange,
}: CalendarListViewProps) {
  const columnCount = showAssignee ? 6 : 5;
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

  const days = grouped
    .map(({ dateKey, dayEvents }) => ({
      dateKey,
      rows: dayEvents.filter(event => event.booking),
    }))
    .filter(day => day.rows.length > 0);

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <h3 className="text-base font-semibold text-white">No bookings</h3>
        <p className="mt-1 text-sm text-gray-400">
          {emptyHint(filter, assignedToMe)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Service
              </th>
              {showAssignee ? (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Assigned to
                </th>
              ) : null}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
              <th className="w-10 px-3 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <Fragment key={day.dateKey}>
                <tr className="bg-white/[0.035]">
                  <th
                    colSpan={columnCount}
                    scope="rowgroup"
                    id={`bookings-day-${day.dateKey}`}
                    className="px-4 py-2.5 text-left text-sm font-semibold text-white"
                  >
                    {formatDayGroupLabel(day.dateKey)}
                  </th>
                </tr>
                {day.rows.map(event => {
                  const booking = event.booking;
                  if (!booking) return null;
                  return (
                    <tr
                      key={event.id}
                      tabIndex={0}
                      aria-label={`Open booking for ${booking.customerName}`}
                      onClick={() => onSelectEvent(event)}
                      onKeyDown={keyEvent =>
                        openOnKey(keyEvent, () => onSelectEvent(event))
                      }
                      className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-sm tabular-nums text-gray-300">
                        {formatListCardTimeForBooking(booking)}
                      </td>
                      <td className="max-w-[16rem] px-4 py-3.5 align-middle">
                        <span className="block truncate text-sm font-semibold text-white">
                          {booking.customerName}
                        </span>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3.5 align-middle text-sm text-gray-300">
                        <span className="block truncate">
                          {bookingListServiceTitle(booking)}
                        </span>
                      </td>
                      {showAssignee ? (
                        <td className="max-w-[12rem] px-4 py-3.5 align-middle text-sm text-gray-300">
                          <span className="block truncate">
                            {event.assigneeLabel ?? '—'}
                          </span>
                        </td>
                      ) : null}
                      <td className="px-4 py-3.5 align-middle">
                        <BookingStatusPill status={booking.status} />
                      </td>
                      <td className="px-3 py-3.5 align-middle text-right">
                        <EllipsisHorizontalIcon
                          className="inline-block h-4 w-4 text-gray-500"
                          aria-hidden
                        />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-6 md:hidden">
        {days.map(day => (
          <section
            key={day.dateKey}
            aria-labelledby={`bookings-day-mobile-${day.dateKey}`}
          >
            <h2
              id={`bookings-day-mobile-${day.dateKey}`}
              className="mb-3 text-sm font-semibold text-white"
            >
              {formatDayGroupLabel(day.dateKey)}
            </h2>
            <ul className="flex list-none flex-col gap-3">
              {day.rows.map(event => {
                const booking = event.booking;
                if (!booking) return null;
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-4 text-left outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-base font-semibold text-white">
                          {booking.customerName}
                        </p>
                        <BookingStatusPill status={booking.status} />
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-400">Time</dt>
                          <dd className="tabular-nums text-gray-200">
                            {formatListCardTimeForBooking(booking)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-400">Service</dt>
                          <dd className="min-w-0 truncate text-gray-200">
                            {bookingListServiceTitle(booking)}
                          </dd>
                        </div>
                        {showAssignee ? (
                          <div className="flex justify-between gap-4">
                            <dt className="text-gray-400">Assigned to</dt>
                            <dd className="min-w-0 truncate text-gray-200">
                              {event.assigneeLabel ?? '—'}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {onPageChange ? (
        <ListPagination
          page={page}
          hasNextPage={hasNextPage}
          isLoading={isLoadingMore}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
