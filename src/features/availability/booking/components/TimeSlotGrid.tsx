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
  onSelectTime: (time: string) => void;
  /** When false, omit the heading (parent supplies section title). */
  showHeading?: boolean;
  /** Section title above the slot grid. Default matches public booking. */
  heading?: string;
  /** Optional line under the heading (e.g. “Open slots only”). */
  headingSubtitle?: string | null;
  /** Copy when no day is selected yet. */
  selectDateHint?: string;
  /** Copy when the selected day has zero slots. */
  noSlotsHint?: string;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  selectedDate,
  serviceDurationMinutes,
  weeklySchedule,
  existingBookings,
  timeOffBlocks,
  selectedTime,
  onSelectTime,
  showHeading = true,
  heading = 'Choose time',
  headingSubtitle = null,
  selectDateHint = 'Select a date to see available times.',
  noSlotsHint = 'No available times for this date.',
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
      <p className="text-sm leading-relaxed text-gray-500 py-4 lg:pt-1">
        {selectDateHint}
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-gray-500 py-4 lg:pt-1">
        {noSlotsHint}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {showHeading ? (
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {heading}
          </h2>
          {headingSubtitle ? (
            <p className="mt-1 text-sm text-gray-500">{headingSubtitle}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(time => (
          <button
            key={time}
            type="button"
            onClick={() => onSelectTime(time)}
            className={`
              min-h-[44px] rounded-xl text-[13px] font-medium transition-colors cursor-pointer sm:min-h-[48px] sm:text-sm
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
