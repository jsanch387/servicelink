'use client';

import React from 'react';
import type { WeeklySchedule } from '../../types/availability';
import type { ExistingBooking, TimeOffInterval } from '../types';
import { generateTimeSlots } from '../utils/slotGeneration';

interface TimeSlotGridProps {
  selectedDate: Date | null;
  serviceDurationMinutes: number;
  weeklySchedule: WeeklySchedule;
  existingBookings: ExistingBooking[];
  timeOffBlocks: TimeOffInterval[];
  selectedTime: string | null;
  // eslint-disable-next-line no-unused-vars
  onSelectTime: (time: string) => void;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  selectedDate,
  serviceDurationMinutes,
  weeklySchedule,
  existingBookings,
  timeOffBlocks,
  selectedTime,
  onSelectTime,
}) => {
  const slots = selectedDate
    ? generateTimeSlots(
        selectedDate,
        weeklySchedule,
        serviceDurationMinutes,
        existingBookings,
        30,
        timeOffBlocks
      )
    : [];

  if (!selectedDate) {
    return (
      <p className="text-sm text-gray-500 py-4">
        Select a date to see available times.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No available times for this date.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        Choose time
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(time => (
          <button
            key={time}
            type="button"
            onClick={() => onSelectTime(time)}
            className={`
              min-h-[48px] rounded-xl text-sm font-medium transition-colors cursor-pointer
              ${selectedTime === time ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}
            `}
          >
            {formatTimeLabel(time)}
          </button>
        ))}
      </div>
    </div>
  );
};

function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
