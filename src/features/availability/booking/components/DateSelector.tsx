'use client';

import { Calendar } from '@/components/shared';
import React, { useCallback } from 'react';
import type { DayKey, WeeklySchedule } from '../../types/availability';
import type { ExistingBooking, TimeOffInterval } from '../types';
import { generateTimeSlots } from '../utils/slotGeneration';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function getDayKey(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

interface DateSelectorProps {
  weeklySchedule: WeeklySchedule;
  serviceDurationMinutes: number;
  existingBookings: ExistingBooking[];
  timeOffBlocks: TimeOffInterval[];
  selectedDate: Date | null;

  onSelectDate: (date: Date) => void;
  minDate?: Date;
  /** Calendar without outer card chrome (nested inside another panel). */
  plainCalendar?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  weeklySchedule,
  serviceDurationMinutes,
  existingBookings,
  timeOffBlocks,
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  plainCalendar = false,
}) => {
  const isDateDisabled = useCallback(
    (date: Date) => {
      const dayKey = getDayKey(date);
      if (!weeklySchedule[dayKey].enabled) return true;

      const slots = generateTimeSlots(
        date,
        weeklySchedule,
        serviceDurationMinutes,
        existingBookings,
        30,
        timeOffBlocks
      );
      return slots.length === 0;
    },
    [weeklySchedule, serviceDurationMinutes, existingBookings, timeOffBlocks]
  );

  return (
    <Calendar
      value={selectedDate}
      onChange={onSelectDate}
      minDate={minDate}
      isDateDisabled={isDateDisabled}
      showYear={true}
      plain={plainCalendar}
    />
  );
};
