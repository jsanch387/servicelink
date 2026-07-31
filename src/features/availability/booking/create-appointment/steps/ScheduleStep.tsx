'use client';

import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import type { ExistingBooking } from '@/features/availability/booking/types';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { toLocalYYYYMMDD } from '@/features/availability/utils/minimumNotice';
import React, { useCallback, useEffect, useMemo } from 'react';
import { hasExactStartTimeConflict } from '../utils/hasExactStartTimeConflict';

function parseYmdLocal(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}

function getTodayAtMidnight(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function formatTimeLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  const min = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h12}${min} ${ampm}`;
}

export interface ScheduleStepProps {
  visitDurationMinutes: number;
  scheduledDate: string | null;
  startTime: string | null;
  weeklySchedule: WeeklySchedule;
  existingBookings: ExistingBooking[];
  scheduleLoading?: boolean;
  onChange: (next: { scheduledDate: string; startTime: string | null }) => void;
  /** Reports whether the selected start matches an existing booking. */
  onExactStartConflictChange?: (hasConflict: boolean) => void;
}

export function ScheduleStep({
  visitDurationMinutes,
  scheduledDate,
  startTime,
  weeklySchedule,
  existingBookings,
  scheduleLoading = false,
  onChange,
  onExactStartConflictChange,
}: ScheduleStepProps) {
  const duration = Math.max(30, visitDurationMinutes || 60);

  const selectedDate = useMemo(
    () => (scheduledDate ? parseYmdLocal(scheduledDate) : null),
    [scheduledDate]
  );
  const minDate = useMemo(() => getTodayAtMidnight(), []);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  const exactStartConflict = useMemo(
    () =>
      hasExactStartTimeConflict({
        scheduledDate,
        startTime,
        existingBookings,
      }),
    [existingBookings, scheduledDate, startTime]
  );

  useEffect(() => {
    onExactStartConflictChange?.(exactStartConflict);
  }, [exactStartConflict, onExactStartConflictChange]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      onChange({
        scheduledDate: toLocalYYYYMMDD(date),
        startTime: null,
      });
    },
    [onChange]
  );

  const handleSelectTime = useCallback(
    (time: string) => {
      if (!scheduledDate) return;
      onChange({ scheduledDate, startTime: time });
    },
    [onChange, scheduledDate]
  );

  return (
    <div className="space-y-6">
      {scheduleLoading ? (
        <p className="text-sm text-zinc-500">Loading your schedule…</p>
      ) : null}

      <div className="space-y-2">
        <DateSelector
          weeklySchedule={weeklySchedule}
          serviceDurationMinutes={duration}
          existingBookings={existingBookings}
          timeOffBlocks={[]}
          minimumNotice="none"
          requireAvailableSlots={false}
          selectedDate={selectedDate}
          minDate={minDate}
          onSelectDate={handleSelectDate}
        />
        {selectedDateLabel ? (
          <p className="px-0.5 text-xs text-zinc-500">
            Selected · {selectedDateLabel}
          </p>
        ) : null}
      </div>

      <TimeSlotGrid
        selectedDate={selectedDate}
        serviceDurationMinutes={duration}
        weeklySchedule={weeklySchedule}
        existingBookings={existingBookings}
        timeOffBlocks={[]}
        minimumNotice="none"
        requireDurationWithinHours={false}
        selectedTime={startTime}
        onSelectTime={handleSelectTime}
        heading="Time"
        selectDateHint="Select a date to see times."
        noSlotsHint="No available times — try another day."
      />

      {exactStartConflict && startTime ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3"
          role="status"
        >
          <p className="text-sm font-medium text-amber-200">
            You already have an appointment at {formatTimeLabel(startTime)}.
          </p>
          <p className="mt-1 text-sm leading-snug text-amber-100/75">
            Pick another time, or continue if you really want to double-book.
          </p>
        </div>
      ) : null}
    </div>
  );
}
