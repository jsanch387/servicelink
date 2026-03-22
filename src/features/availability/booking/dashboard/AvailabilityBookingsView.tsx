'use client';

import { Button } from '@/components/shared';
import { getBusinessBookPath } from '@/constants/routes';
import { FreeBookingsTracker } from '@/features/pricing';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { AvailabilityBookingCard } from './AvailabilityBookingCard';
import { AvailabilityBookingsViewSkeleton } from './AvailabilityBookingCardSkeleton';
import { AvailabilityBookingDetailPanel } from './AvailabilityBookingDetailPanel';
import { BookingsStatusFilter } from './BookingsStatusFilter';
import { BookingsViewModeToggle } from './BookingsViewModeToggle';
import { DayPlannerView } from './DayPlannerView';
import { localDateKey } from './dayPlannerUtils';
import type { BlockTimeEntry } from '@/features/availability/types/blockTime';
import { useAvailabilityBookings } from './hooks/useAvailabilityBookings';
import type { AvailabilityBookingDisplay } from './types';

type TabId = 'upcoming' | 'past' | 'cancelled';
type LayoutMode = 'list' | 'planner';

function sortByDateThenTime(
  a: AvailabilityBookingDisplay,
  b: AvailabilityBookingDisplay
): number {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;
  return a.time.localeCompare(b.time);
}

/** YYYY-MM-DD → "Mar 25" */
function formatDayGroupLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function maxCreatedAtMs(bookings: AvailabilityBookingDisplay[]): number {
  return Math.max(
    ...bookings.map(b => new Date(b.createdAt).getTime()),
    Number.NEGATIVE_INFINITY
  );
}

/**
 * One heading per calendar day; order matches each tab (upcoming asc, past desc,
 * cancelled by most recent cancellation in that day).
 */
function groupBookingsByDayForTab(
  list: AvailabilityBookingDisplay[],
  tab: TabId
): {
  dateKey: string;
  label: string;
  bookings: AvailabilityBookingDisplay[];
}[] {
  if (list.length === 0) return [];

  const map = new Map<string, AvailabilityBookingDisplay[]>();
  for (const b of list) {
    const arr = map.get(b.date) ?? [];
    arr.push(b);
    map.set(b.date, arr);
  }

  for (const arr of map.values()) {
    if (tab === 'cancelled') {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (tab === 'past') {
      arr.sort((a, b) => -sortByDateThenTime(a, b));
    } else {
      arr.sort(sortByDateThenTime);
    }
  }

  const dayKeys = [...map.keys()];
  if (tab === 'upcoming') {
    dayKeys.sort((a, b) => a.localeCompare(b));
  } else if (tab === 'past') {
    dayKeys.sort((a, b) => b.localeCompare(a));
  } else {
    dayKeys.sort(
      (a, b) => maxCreatedAtMs(map.get(b)!) - maxCreatedAtMs(map.get(a)!)
    );
  }

  return dayKeys.map(dateKey => ({
    dateKey,
    label: formatDayGroupLabel(dateKey),
    bookings: map.get(dateKey)!,
  }));
}

export interface AvailabilityBookingsViewProps {
  /** Public page slug for customer booking URL; when missing, New appointment is disabled. */
  businessSlug?: string | null;
  /** Free plan: bookings used this month (0–5). Shown in tracker. */
  freeBookingsUsed?: number;
  /** When false (Pro), hide the free bookings tracker. */
  showFreeBookingsTracker?: boolean;
  /** Owner time-off blocks for planner overlay (from availability). */
  timeOffBlocks?: BlockTimeEntry[];
}

export function AvailabilityBookingsView({
  businessSlug = null,
  freeBookingsUsed = 0,
  showFreeBookingsTracker = true,
  timeOffBlocks = [],
}: AvailabilityBookingsViewProps = {}) {
  const { bookings, isLoading, error, updateBookingStatus } =
    useAvailabilityBookings();
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [plannerDateKey, setPlannerDateKey] = useState(() =>
    localDateKey(new Date())
  );
  const [selectedBooking, setSelectedBooking] =
    useState<AvailabilityBookingDisplay | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const trimmedSlug = businessSlug?.trim() ?? '';
  const newAppointmentHref = trimmedSlug
    ? getBusinessBookPath(trimmedSlug, { forOwner: true })
    : undefined;

  const { upcoming, past, cancelled } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const upcoming: AvailabilityBookingDisplay[] = [];
    const past: AvailabilityBookingDisplay[] = [];
    const cancelled: AvailabilityBookingDisplay[] = [];

    for (const b of bookings) {
      if (b.status === 'cancelled') {
        cancelled.push(b);
        continue;
      }
      if (b.status === 'completed') {
        past.push(b);
        continue;
      }
      if (b.date > today || (b.date === today && b.status === 'confirmed')) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }

    upcoming.sort(sortByDateThenTime);
    past.sort((a, b) => -sortByDateThenTime(a, b));
    cancelled.sort(
      (a, b) =>
        -new Date(a.createdAt).getTime() + new Date(b.createdAt).getTime()
    );
    return { upcoming, past, cancelled };
  }, [bookings]);

  const filteredList =
    activeTab === 'upcoming'
      ? upcoming
      : activeTab === 'past'
        ? past
        : cancelled;

  const groupedByDay = useMemo(
    () => groupBookingsByDayForTab(filteredList, activeTab),
    [filteredList, activeTab]
  );

  /** Day planner shows every booking that day (incl. cancelled), not list-tab filter. */
  const plannerDayBookings = useMemo(
    () =>
      bookings.filter(b => b.date === plannerDateKey).sort(sortByDateThenTime),
    [bookings, plannerDateKey]
  );

  const plannerDayTimeOff = useMemo(
    () => timeOffBlocks.filter(b => b.date === plannerDateKey),
    [timeOffBlocks, plannerDateKey]
  );

  const handleMarkCompleted = async (id: string) => {
    setUpdateError(null);
    setUpdatingId(id);
    const result = await updateBookingStatus(id, 'completed');
    setUpdatingId(null);
    if (!result.success) {
      setUpdateError(result.error ?? 'Failed to update booking');
      return;
    }
    setSelectedBooking(null);
  };

  const handleCancel = async (id: string) => {
    setUpdateError(null);
    setUpdatingId(id);
    const result = await updateBookingStatus(id, 'cancelled');
    setUpdatingId(null);
    if (!result.success) {
      setUpdateError(result.error ?? 'Failed to cancel booking');
      return;
    }
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white w-full overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bookings
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage your appointments
            </p>
          </div>
          <Button
            href={newAppointmentHref}
            disabled={!newAppointmentHref}
            variant="inverse"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            className="w-full shrink-0 sm:mt-0.5 sm:w-auto"
            title={
              newAppointmentHref
                ? undefined
                : 'Set your public page URL under Business profile to create bookings from here.'
            }
            aria-label={
              newAppointmentHref
                ? 'New appointment for a customer'
                : 'New appointment unavailable. Set your public page URL under Business profile first.'
            }
          >
            New appointment
          </Button>
        </div>
      </header>

      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 max-w-xl lg:max-w-3xl mx-auto w-full">
        {(error || updateError) && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 text-sm mb-4">
            {error ?? updateError}
          </div>
        )}
        {showFreeBookingsTracker && (
          <FreeBookingsTracker
            bookingsUsed={freeBookingsUsed}
            className="mb-4"
          />
        )}
        <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
          <BookingsViewModeToggle
            value={layoutMode}
            onChange={setLayoutMode}
            className="flex min-w-0 shrink justify-start"
          />
          {layoutMode === 'list' ? (
            <BookingsStatusFilter
              value={activeTab}
              onChange={setActiveTab}
              className="shrink-0"
            />
          ) : null}
        </div>
        {isLoading ? (
          <AvailabilityBookingsViewSkeleton />
        ) : layoutMode === 'planner' ? (
          <DayPlannerView
            dateKey={plannerDateKey}
            onDateKeyChange={setPlannerDateKey}
            dayBookings={plannerDayBookings}
            dayTimeOffBlocks={plannerDayTimeOff}
            onSelectBooking={booking => {
              setUpdateError(null);
              setSelectedBooking(booking);
            }}
          />
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-gray-400 font-bold">No bookings</h3>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'upcoming'
                ? 'No upcoming appointments.'
                : activeTab === 'past'
                  ? 'No past appointments.'
                  : 'No cancelled bookings.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-7 pb-20 sm:pb-24">
            {groupedByDay.map(group => (
              <section
                key={group.dateKey}
                aria-labelledby={`bookings-day-${group.dateKey}`}
              >
                <h2
                  id={`bookings-day-${group.dateKey}`}
                  className="text-gray-400 font-bold text-sm sm:text-base tracking-tight mb-3"
                >
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.bookings.map(booking => (
                    <AvailabilityBookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => {
                        setUpdateError(null);
                        setSelectedBooking(booking);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {selectedBooking && (
        <AvailabilityBookingDetailPanel
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onMarkCompleted={handleMarkCompleted}
          onCancel={handleCancel}
          isUpdating={updatingId === selectedBooking.id}
          updateError={updateError}
        />
      )}
    </div>
  );
}
