'use client';

import { Calendar } from '@/components/shared';
import React, { useCallback } from 'react';
import type { DayKey, WeeklySchedule } from '../../types/availability';

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
  selectedDate: Date | null;
  // eslint-disable-next-line no-unused-vars
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  weeklySchedule,
  selectedDate,
  onSelectDate,
  minDate = new Date(),
}) => {
  const isDateDisabled = useCallback(
    (date: Date) => {
      const dayKey = getDayKey(date);
      return !weeklySchedule[dayKey].enabled;
    },
    [weeklySchedule]
  );

  return (
    <Calendar
      value={selectedDate}
      onChange={onSelectDate}
      minDate={minDate}
      isDateDisabled={isDateDisabled}
      showYear={true}
    />
  );
};
