'use client';

import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { toLocalYYYYMMDD } from '@/features/availability/utils/minimumNotice';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
import React, { useMemo } from 'react';
import { buildOwnerFlexibleWeeklySchedule } from '../utils/ownerFlexibleSchedule';

function parseYmdLocal(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}

function getTodayAtMidnight(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export interface ScheduleStepProps {
  businessSlug: string | null;
  visitDurationMinutes: number;
  scheduledDate: string | null;
  startTime: string | null;
  onChange: (next: {
    scheduledDate: string;
    startTime: string | null;
  }) => void;
}

export function ScheduleStep({
  businessSlug,
  visitDurationMinutes,
  scheduledDate,
  startTime,
  onChange,
}: ScheduleStepProps) {
  const { weeklySchedule, loading: scheduleLoading } =
    useOwnerQuoteScheduling();
  const { blockedSlots, loading: blockedLoading } =
    usePublicBlockedSlots(businessSlug?.trim() || undefined);

  const duration = Math.max(30, visitDurationMinutes || 60);

  const flexibleSchedule: WeeklySchedule = useMemo(
    () => buildOwnerFlexibleWeeklySchedule(weeklySchedule),
    [weeklySchedule]
  );

  const selectedDate = scheduledDate ? parseYmdLocal(scheduledDate) : null;
  const loading = scheduleLoading || blockedLoading;

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-sm text-zinc-500">Loading your schedule…</p>
      ) : null}

      <DateSelector
        weeklySchedule={flexibleSchedule}
        serviceDurationMinutes={duration}
        existingBookings={blockedSlots}
        timeOffBlocks={[]}
        minimumNotice="none"
        requireAvailableSlots={false}
        selectedDate={selectedDate}
        minDate={getTodayAtMidnight()}
        onSelectDate={date => {
          onChange({
            scheduledDate: toLocalYYYYMMDD(date),
            startTime: null,
          });
        }}
      />

      <TimeSlotGrid
        selectedDate={selectedDate}
        serviceDurationMinutes={duration}
        weeklySchedule={flexibleSchedule}
        existingBookings={blockedSlots}
        timeOffBlocks={[]}
        minimumNotice="none"
        requireDurationWithinHours={false}
        selectedTime={startTime}
        onSelectTime={time => {
          if (!scheduledDate) return;
          onChange({ scheduledDate, startTime: time });
        }}
        heading="Time"
        selectDateHint="Select a date to see times."
        noSlotsHint="No available times — try another day."
      />
    </div>
  );
}
