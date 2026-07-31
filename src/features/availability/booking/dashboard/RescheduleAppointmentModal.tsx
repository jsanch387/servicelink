'use client';

import { Button, Modal } from '@/components/shared';
import {
  PublicFlowBackChevron,
  publicFlowBackNavClassName,
} from '@/components/shared/publicFlowBackNav';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import type {
  ExistingBooking,
  TimeOffInterval,
} from '@/features/availability/booking/types';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { localDateKey } from './dayPlannerUtils';
import type { AvailabilityBookingDisplay } from './types';
import { bookingListServiceTitle } from './utils/bookingCardServiceTitle';

type RescheduleStep = 'date' | 'time';

export interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  booking: AvailabilityBookingDisplay;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  existingBookingsForSlotGrid: ExistingBooking[];
  isRescheduling?: boolean;
  onClose: () => void;
  onSave: (
    scheduledDate: string,
    startTime: string
  ) => Promise<{ success: boolean; error?: string }>;
}

function formatSelectedDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatBookingDateLabel(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function RescheduleAppointmentModal({
  isOpen,
  booking,
  weeklySchedule,
  timeOffBlocks,
  existingBookingsForSlotGrid,
  isRescheduling = false,
  onClose,
  onSave,
}: RescheduleAppointmentModalProps) {
  const [step, setStep] = useState<RescheduleStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);
    setError(null);
    setStep('date');
    setSelectedDate(new Date(`${booking.date}T12:00:00`));
    setSelectedTime(booking.startTimeHHmm);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init when modal opens / booking changes
  }, [isOpen, booking.id]);

  const serviceTitle = bookingListServiceTitle(booking);
  const selectedDateLabel = useMemo(
    () => (selectedDate ? formatSelectedDateLabel(selectedDate) : null),
    [selectedDate]
  );

  const modalTitle = success
    ? 'Reschedule'
    : step === 'date'
      ? 'Pick a date'
      : 'Pick a time';

  const handleClose = () => {
    if (isRescheduling) return;
    setSuccess(false);
    onClose();
  };

  const handleBackToDate = () => {
    if (isRescheduling) return;
    setError(null);
    setStep('date');
  };

  const handleSave = async () => {
    setError(null);
    if (!selectedDate || !selectedTime?.trim()) {
      setError('Choose a date and an available time.');
      return;
    }
    const result = await onSave(
      localDateKey(selectedDate),
      selectedTime.trim()
    );
    if (!result.success) {
      setError(result.error ?? 'Could not save the new time.');
      return;
    }
    setSuccess(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="sm"
      uniformHorizontalPadding16
      titleClassName="font-bold"
      contentClassName="scrollbar-dark !pt-4 sm:!pt-5 !pb-4 sm:!pb-5"
      preventClose={isRescheduling}
    >
      {success ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-5 text-center">
            <CheckCircleSolidIcon
              className="mx-auto h-10 w-10 text-emerald-400"
              aria-hidden
            />
            <p className="mt-3 text-base font-semibold text-white">
              Appointment updated
            </p>
            <p className="mt-1 text-sm text-gray-300 [overflow-wrap:anywhere]">
              {serviceTitle}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {formatBookingDateLabel(booking.date)}
              <span className="text-gray-600"> · </span>
              {booking.time}
              <span className="text-gray-600"> · </span>
              {formatDurationMinutes(booking.serviceDurationMinutes)}
            </p>
          </div>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            fullWidth
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {step === 'time' ? (
            <div className="-mt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                className={publicFlowBackNavClassName}
                onClick={handleBackToDate}
                disabled={isRescheduling}
              >
                <PublicFlowBackChevron />
                <span>Date</span>
              </button>
              {selectedDateLabel ? (
                <p className="min-w-0 truncate text-right text-xs text-zinc-500">
                  {selectedDateLabel}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white [overflow-wrap:anywhere]">
              {serviceTitle}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Currently {formatBookingDateLabel(booking.date)} · {booking.time}
            </p>
          </div>

          {error ? (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : null}

          {step === 'date' ? (
            <>
              <div className="space-y-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 shadow-xl">
                  <DateSelector
                    weeklySchedule={weeklySchedule}
                    serviceDurationMinutes={booking.serviceDurationMinutes}
                    existingBookings={existingBookingsForSlotGrid}
                    timeOffBlocks={timeOffBlocks}
                    selectedDate={selectedDate}
                    plainCalendar
                    compactCalendar
                    onSelectDate={date => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setError(null);
                      setStep('time');
                    }}
                  />
                </div>
                {selectedDateLabel ? (
                  <p className="px-0.5 text-xs text-zinc-500">
                    Selected · {selectedDateLabel}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={isRescheduling}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  fullWidth
                  disabled={!selectedDate || isRescheduling}
                  onClick={() => {
                    if (!selectedDate) return;
                    setError(null);
                    setStep('time');
                  }}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <TimeSlotGrid
                selectedDate={selectedDate}
                serviceDurationMinutes={booking.serviceDurationMinutes}
                weeklySchedule={weeklySchedule}
                existingBookings={existingBookingsForSlotGrid}
                timeOffBlocks={timeOffBlocks}
                selectedTime={selectedTime}
                onSelectTime={time => {
                  setSelectedTime(time);
                  setError(null);
                }}
                heading="Time"
                compact
                selectDateHint="Select a date to see times."
                noSlotsHint="No available times — try another day."
              />

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={isRescheduling}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  fullWidth
                  disabled={isRescheduling || !selectedDate || !selectedTime}
                  loading={isRescheduling}
                  onClick={() => void handleSave()}
                  aria-label={
                    isRescheduling ? 'Updating appointment' : 'Save new time'
                  }
                >
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
