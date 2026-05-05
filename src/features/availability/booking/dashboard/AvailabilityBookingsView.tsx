'use client';

import { Button } from '@/components/shared';
import { getBusinessBookPath } from '@/constants/routes';
import type { BlockTimeEntry } from '@/features/availability/types/blockTime';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import type {
  ExistingBooking,
  TimeOffInterval,
} from '@/features/availability/booking/types';
import {
  SyncBookingsConfirmModal,
  SyncBookingsCtaCard,
} from '@/features/calendar-sync';
import { FreeBookingsTracker } from '@/features/pricing';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { AvailabilityBookingCard } from './AvailabilityBookingCard';
import { AvailabilityBookingsViewSkeleton } from './AvailabilityBookingCardSkeleton';
import { AvailabilityBookingDetailPanel } from './AvailabilityBookingDetailPanel';
import { BookingsStatusFilter } from './BookingsStatusFilter';
import { BookingsViewModeToggle } from './BookingsViewModeToggle';
import { DayPlannerView } from './DayPlannerView';
import { localDateKey } from './dayPlannerUtils';
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
  /** Weekly hours for reschedule slot picker (same rules as public booking). */
  weeklySchedule: WeeklySchedule;
}

export function AvailabilityBookingsView({
  businessSlug = null,
  freeBookingsUsed = 0,
  showFreeBookingsTracker = true,
  timeOffBlocks = [],
  weeklySchedule,
}: AvailabilityBookingsViewProps) {
  const { bookings, isLoading, error, updateBookingStatus, rescheduleBooking } =
    useAvailabilityBookings();
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [plannerDateKey, setPlannerDateKey] = useState(() =>
    localDateKey(new Date())
  );
  const [selectedBooking, setSelectedBooking] =
    useState<AvailabilityBookingDisplay | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [syncCalendarModalOpen, setSyncCalendarModalOpen] = useState(false);

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

  const timeOffIntervalsForSlots = useMemo<TimeOffInterval[]>(
    () =>
      timeOffBlocks.map(b => ({
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    [timeOffBlocks]
  );

  const existingBookingsForReschedule = useMemo<ExistingBooking[]>(() => {
    if (!selectedBooking) return [];
    return bookings
      .filter(
        b =>
          b.id !== selectedBooking.id &&
          (b.status === 'confirmed' || b.status === 'completed')
      )
      .map(b => ({
        date: b.date,
        startTime: b.startTimeHHmm,
        durationMinutes: b.serviceDurationMinutes,
      }));
  }, [bookings, selectedBooking]);

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

  const handleReschedule = useCallback(
    async (id: string, scheduledDate: string, startTime: string) => {
      setUpdateError(null);
      setReschedulingId(id);
      const result = await rescheduleBooking(id, scheduledDate, startTime);
      setReschedulingId(null);
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      setSelectedBooking(result.booking);
      return { success: true as const };
    },
    [rescheduleBooking]
  );

  /** Same approach as shared Modal: freeze document scroll so only the detail sheet moves (esp. iOS). */
  useLayoutEffect(() => {
    if (!selectedBooking) return;

    const html = document.documentElement;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const prevBodyOverflow = document.body.style.overflow;

    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      document.body.style.overflow = prevBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [selectedBooking]);

  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden bg-[#0f0f0f] text-white">
      <div
        className={`min-h-0 flex-1 pb-36 ${selectedBooking ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <header className="sticky top-0 z-10 w-full border-b border-white/[0.05] bg-[#0f0f0f]/80 px-3 pt-4 pb-3 backdrop-blur-xl sm:px-4 sm:pt-6 sm:pb-4 md:px-6 md:pt-8 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 text-left">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                Bookings
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Manage your appointments
              </p>
            </div>
            <SyncBookingsCtaCard
              variant="header"
              onSyncClick={() => setSyncCalendarModalOpen(true)}
            />
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 lg:max-w-3xl lg:px-8 lg:py-6">
          {(error || updateError) && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
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
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05]">
                <CalendarIcon className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="font-bold text-gray-400">No bookings</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming'
                  ? 'No upcoming appointments.'
                  : activeTab === 'past'
                    ? 'No past appointments.'
                    : 'No cancelled bookings.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-7">
              {groupedByDay.map(group => (
                <section
                  key={group.dateKey}
                  aria-labelledby={`bookings-day-${group.dateKey}`}
                >
                  <h2
                    id={`bookings-day-${group.dateKey}`}
                    className="mb-3 text-sm font-bold tracking-tight text-gray-400 sm:text-base"
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
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#0f0f0f]/95 px-3 pt-4 backdrop-blur-md sm:px-4 md:px-6 lg:left-64 lg:px-8 safe-area-pb"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          <Button
            href={newAppointmentHref}
            disabled={!newAppointmentHref}
            variant="inverse"
            fullWidth
            className="font-semibold"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
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
      </div>

      {selectedBooking && (
        <AvailabilityBookingDetailPanel
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onMarkCompleted={handleMarkCompleted}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          isUpdating={updatingId === selectedBooking.id}
          isRescheduling={reschedulingId === selectedBooking.id}
          updateError={updateError}
          weeklySchedule={weeklySchedule}
          timeOffBlocks={timeOffIntervalsForSlots}
          existingBookingsForSlotGrid={existingBookingsForReschedule}
        />
      )}

      <SyncBookingsConfirmModal
        isOpen={syncCalendarModalOpen}
        onClose={() => setSyncCalendarModalOpen(false)}
        isProSubscriber={!showFreeBookingsTracker}
      />
    </main>
  );
}
