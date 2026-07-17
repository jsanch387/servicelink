'use client';

import { Calendar } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useEffect } from 'react';
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
  /** Called only for an explicit calendar click, not automatic initial selection. */
  onUserSelectDate?: (date: Date) => void;
  minDate?: Date;
  /** Calendar without outer card chrome (nested inside another panel). */
  plainCalendar?: boolean;
  /** Shown above the month header (passed to shared Calendar). */
  calendarTitle?: string;
  /** Muted line under title (e.g. availability hint). */
  calendarSubtitle?: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  weeklySchedule,
  serviceDurationMinutes,
  existingBookings,
  timeOffBlocks,
  selectedDate,
  onSelectDate,
  onUserSelectDate,
  minDate = new Date(),
  plainCalendar = false,
  calendarTitle,
  calendarSubtitle,
  bookingFlowLocale = 'en',
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

  useEffect(() => {
    const earliestDate = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate()
    );
    const selectedDay = selectedDate
      ? new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
      : null;

    if (
      selectedDay &&
      selectedDay.getTime() >= earliestDate.getTime() &&
      !isDateDisabled(selectedDay)
    ) {
      return;
    }

    for (let offset = 0; offset < 366; offset += 1) {
      const candidate = new Date(earliestDate);
      candidate.setDate(earliestDate.getDate() + offset);
      if (!isDateDisabled(candidate)) {
        onSelectDate(candidate);
        return;
      }
    }
  }, [isDateDisabled, minDate, onSelectDate, selectedDate]);

  return (
    <Calendar
      value={selectedDate}
      onChange={date => {
        onSelectDate(date);
        onUserSelectDate?.(date);
      }}
      minDate={minDate}
      isDateDisabled={isDateDisabled}
      showYear={true}
      plain={plainCalendar}
      title={calendarTitle}
      subtitle={calendarSubtitle}
      locale={bcp47ForBookingLocale(bookingFlowLocale)}
      wide
    />
  );
};
