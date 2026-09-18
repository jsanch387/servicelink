'use client';

import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import type { ExistingBooking } from '@/features/availability/booking/types';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { toLocalYYYYMMDD } from '@/features/availability/utils/minimumNotice';
import React, { useCallback, useMemo } from 'react';
import {
  countBookingsOnDate,
  sameDayAppointmentHeadsUp,
} from '../utils/hasExactStartTimeConflict';

function parseYmdLocal(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}

function getTodayAtMidnight(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export interface ScheduleStepProps {
  visitDurationMinutes: number;
  scheduledDate: string | null;
  startTime: string | null;
  weeklySchedule: WeeklySchedule;
  existingBookings: ExistingBooking[];
  bufferTime?: string;
  scheduleLoading?: boolean;
  onChange: (next: { scheduledDate: string; startTime: string | null }) => void;
}

export function ScheduleStep({
  visitDurationMinutes,
  scheduledDate,
  startTime,
  weeklySchedule,
  existingBookings,
  bufferTime = 'none',
  scheduleLoading = false,
  onChange,
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

  const sameDayHeadsUp = useMemo(
    () =>
      sameDayAppointmentHeadsUp(
        countBookingsOnDate(scheduledDate, existingBookings)
      ),
    [existingBookings, scheduledDate]
  );

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
        {/* Occupied times stay pickable; same-day count is a heads-up only. */}
        <DateSelector
          weeklySchedule={weeklySchedule}
          serviceDurationMinutes={duration}
          existingBookings={[]}
          timeOffBlocks={[]}
          minimumNotice="none"
          bufferTime={bufferTime}
          requireAvailableSlots
          requireDurationWithinHours={false}
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
        existingBookings={[]}
        timeOffBlocks={[]}
        minimumNotice="none"
        bufferTime={bufferTime}
        requireDurationWithinHours={false}
        selectedTime={startTime}
        onSelectTime={handleSelectTime}
        heading="Time"
        selectDateHint="Select a date to see times."
        noSlotsHint="No available times — try another day."
      />

      {sameDayHeadsUp ? (
        <div
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
          role="status"
        >
          <p className="text-sm leading-snug text-zinc-300">{sameDayHeadsUp}</p>
        </div>
      ) : null}
    </div>
  );
}
