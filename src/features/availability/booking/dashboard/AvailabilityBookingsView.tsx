'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  toTimeOffIntervalFields,
  type BlockTimeEntry,
} from '@/features/availability/types/blockTime';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import type {
  ExistingBooking,
  TimeOffInterval,
} from '@/features/availability/booking/types';
// Hidden on web for now — calendar lives in the mobile app.
// import {
//   SyncBookingsConfirmModal,
//   SyncBookingsCtaCard,
// } from '@/features/calendar-sync';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import { shopHasBookingAssignees } from '@/features/team/utils/shopHasBookingAssignees';
import { FreeBookingsTracker, FREE_BOOKINGS_LIMIT } from '@/features/pricing';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { AvailabilityBookingDetailPanel } from './AvailabilityBookingDetailPanel';
import { BookingsCalendar } from './calendar/BookingsCalendar';
import { CalendarModeToggle } from './calendar/CalendarModeToggle';
import type { CalendarMode } from './calendar/types';
import {
  BookingsAssignedToMeFilter,
  BookingsStatusFilter,
  type BookingsStatusFilterValue,
} from './BookingsStatusFilter';
import { useAvailabilityBookings } from './hooks/useAvailabilityBookings';
import { useBookingAssignees } from './hooks/useBookingAssignees';
import { useNewAppointmentAction } from './hooks/useNewAppointmentAction';
import type { AvailabilityBookingDisplay } from './types';

export interface AvailabilityBookingsViewProps {
  /** Public page slug for customer booking URL; when missing, New appointment is disabled. */
  businessSlug?: string | null;
  /** Free plan: public bookings used toward lifetime cap (0–5). Shown in tracker. */
  freeBookingsUsed?: number;
  /** When false (Pro), hide the free bookings tracker. */
  showFreeBookingsTracker?: boolean;
  /** Owner time-off blocks for the calendar overlay. */
  timeOffBlocks?: BlockTimeEntry[];
  /** Weekly hours for reschedule slot picker (hours + time off still apply). */
  weeklySchedule: WeeklySchedule;
  bufferTime?: string;
  /** Invoices are Pro-only. */
  canCreateInvoice?: boolean;
}

export function AvailabilityBookingsView({
  businessSlug = null,
  freeBookingsUsed = 0,
  showFreeBookingsTracker = true,
  timeOffBlocks = [],
  weeklySchedule,
  bufferTime = 'none',
  canCreateInvoice = true,
}: AvailabilityBookingsViewProps) {
  const access = useDashboardAccess();
  const canWriteBookings = access.can('bookings.write');
  const canRunBookings = access.can('bookings.run');
  const {
    bookings,
    isLoading,
    isLoadingMore,
    listPageIndex,
    hasNextListPage,
    setListPage,
    error,
    loadListPage,
    loadRange,
    updateBookingStatus,
    completeBookingJob,
    rescheduleBooking,
    updateBookingAssignee,
    deleteBooking,
  } = useAvailabilityBookings();
  const { assignees } = useBookingAssignees();
  const canAssignBookings = shopHasBookingAssignees(assignees);
  const [activeTab, setActiveTab] =
    useState<BookingsStatusFilterValue>('upcoming');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('list');
  const [selectedBooking, setSelectedBooking] =
    useState<AvailabilityBookingDisplay | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // const [syncCalendarModalOpen, setSyncCalendarModalOpen] = useState(false);

  const trimmedSlug = businessSlug?.trim() ?? '';
  const manualBookingBlockedByCap = useMemo(() => {
    if (!showFreeBookingsTracker) return false;
    return freeBookingsUsed >= FREE_BOOKINGS_LIMIT;
  }, [showFreeBookingsTracker, freeBookingsUsed]);

  const newAppointment = useNewAppointmentAction({
    hasPublicPageSlug: Boolean(trimmedSlug),
    atFreeBookingCap: manualBookingBlockedByCap,
  });
  const loadCurrentList = useCallback(() => {
    void loadListPage(activeTab, { assignedToMe });
  }, [activeTab, assignedToMe, loadListPage]);
  const loadVisibleRange = useCallback(
    (from: string, to: string) => {
      void loadRange(from, to, { assignedToMe });
    },
    [assignedToMe, loadRange]
  );

  const timeOffIntervalsForSlots = useMemo<TimeOffInterval[]>(
    () => timeOffBlocks.map(toTimeOffIntervalFields),
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

  const handleMarkCompleted = async (
    id: string,
    args?: {
      sessionPayment?: {
        method: 'cash' | 'payment_app' | 'other';
        amountCents: number;
      };
    }
  ) => {
    setUpdateError(null);
    setUpdatingId(id);
    const result = await completeBookingJob({
      id,
      sessionPayment: args?.sessionPayment,
    });
    setUpdatingId(null);
    if (!result.success) {
      setUpdateError(result.error ?? 'Failed to complete booking');
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

  const handleDelete = async (id: string) => {
    setUpdateError(null);
    setUpdatingId(id);
    const result = await deleteBooking(id);
    setUpdatingId(null);
    if (!result.success) {
      setUpdateError(result.error ?? 'Failed to delete booking');
      return;
    }
    setSelectedBooking(null);
  };

  const handleAssign = useCallback(
    async (userId: string | null) => {
      if (!selectedBooking) {
        return { success: false as const, error: 'No appointment selected.' };
      }
      setAssigningId(selectedBooking.id);
      const result = await updateBookingAssignee(selectedBooking.id, userId);
      setAssigningId(null);
      if (!result.success) {
        return {
          success: false as const,
          error: result.error ?? 'Could not update assignee',
        };
      }
      setSelectedBooking(prev =>
        prev ? { ...prev, assignedUserId: userId } : prev
      );
      return { success: true as const };
    },
    [selectedBooking, updateBookingAssignee]
  );

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
    <main className="relative flex h-full min-h-0 flex-1 flex-col overflow-x-hidden text-white">
      <div
        className={`min-h-0 flex-1 ${
          selectedBooking ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-none text-white">
                Bookings
              </h1>
              <p className="mt-1 text-gray-400">
                Appointments on the list or the calendar.
              </p>
            </div>
            {canWriteBookings ? (
              <Button
                href={newAppointment.enabled ? newAppointment.href : undefined}
                onClick={
                  newAppointment.enabled
                    ? undefined
                    : newAppointment.onBlockedClick
                }
                variant="inverse"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" aria-hidden />}
                className="w-full shrink-0 sm:w-auto"
                title={newAppointment.title}
                aria-label={newAppointment.ariaLabel}
              >
                New appointment
              </Button>
            ) : null}
          </header>
          {newAppointment.notice ? (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-sm leading-relaxed text-zinc-300"
            >
              <p>{newAppointment.notice}</p>
              {manualBookingBlockedByCap ? (
                <a
                  href={ROUTES.DASHBOARD.UPGRADE}
                  className="mt-2 inline-flex cursor-pointer text-sm font-semibold text-white underline-offset-2 hover:underline"
                >
                  Upgrade to Pro
                </a>
              ) : null}
            </div>
          ) : null}
          {(error || updateError) && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error ?? updateError}
            </div>
          )}
          {showFreeBookingsTracker && (
            <FreeBookingsTracker
              bookingsUsed={freeBookingsUsed}
              className="mb-6"
            />
          )}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CalendarModeToggle
              value={calendarMode}
              onChange={setCalendarMode}
            />
            <div className="flex items-center justify-end gap-2">
              {canAssignBookings ? (
                <BookingsAssignedToMeFilter
                  pressed={assignedToMe}
                  onPressedChange={setAssignedToMe}
                />
              ) : null}
              {calendarMode === 'list' ? (
                <BookingsStatusFilter
                  value={activeTab}
                  onChange={setActiveTab}
                />
              ) : null}
            </div>
          </div>
          <BookingsCalendar
            bookings={bookings}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            listPage={calendarMode === 'list' ? listPageIndex : 0}
            hasNextListPage={calendarMode === 'list' && hasNextListPage}
            onListPageChange={
              calendarMode === 'list'
                ? page => void setListPage(page)
                : undefined
            }
            mode={calendarMode}
            onModeChange={setCalendarMode}
            listFilter={activeTab}
            assignedToMe={assignedToMe}
            assigneeOptions={assignees}
            timeOffBlocks={timeOffBlocks}
            onListActive={loadCurrentList}
            onVisibleRangeChange={loadVisibleRange}
            onSelectBooking={booking => {
              setUpdateError(null);
              setSelectedBooking(booking);
            }}
          />
        </div>
      </div>

      {selectedBooking && (
        <AvailabilityBookingDetailPanel
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          readOnly={!canWriteBookings}
          canRunActions={canRunBookings}
          onMarkCompleted={handleMarkCompleted}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onReschedule={canWriteBookings ? handleReschedule : undefined}
          isUpdating={updatingId === selectedBooking.id}
          isRescheduling={reschedulingId === selectedBooking.id}
          updateError={updateError}
          weeklySchedule={weeklySchedule}
          timeOffBlocks={timeOffIntervalsForSlots}
          bufferTime={bufferTime}
          existingBookingsForSlotGrid={existingBookingsForReschedule}
          canCreateInvoice={canCreateInvoice}
          assigneeOptions={assignees}
          onAssign={canAssignBookings ? handleAssign : undefined}
          isAssigning={assigningId === selectedBooking.id}
        />
      )}

      {/* Hidden on web for now — calendar lives in the mobile app.
      <SyncBookingsConfirmModal
        isOpen={syncCalendarModalOpen}
        onClose={() => setSyncCalendarModalOpen(false)}
        isProSubscriber={!showFreeBookingsTracker}
      />
      */}
    </main>
  );
}
