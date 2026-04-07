'use client';

import { Switch, TimeSelect } from '@/components/shared';
import React from 'react';
import type { DayKey, WeeklySchedule } from '../types/availability';

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DAY_KEYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

interface WeeklyScheduleGridProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
  disabled?: boolean;
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  schedule,
  onChange,
  disabled = false,
}) => {
  const updateDay = (day: DayKey, updates: Partial<WeeklySchedule[DayKey]>) => {
    const next = { ...schedule, [day]: { ...schedule[day], ...updates } };
    const daySchedule = next[day];
    if (
      daySchedule.start &&
      daySchedule.end &&
      daySchedule.start > daySchedule.end
    ) {
      next[day] = { ...daySchedule, end: daySchedule.start };
    }
    onChange(next);
  };

  const isDisabled = disabled;

  return (
    <div className={isDisabled ? 'pointer-events-none opacity-50' : ''}>
      {/* Desktop: table with headers */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[140px_80px_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/10">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Day
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
            On
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Start
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            End
          </span>
        </div>
        {DAY_KEYS.map(day => {
          const daySchedule = schedule[day];
          const enabled = daySchedule.enabled;
          return (
            <div
              key={day}
              className="grid grid-cols-[140px_80px_1fr_1fr] gap-4 items-center px-5 py-3 border-b border-white/5 last:border-b-0"
            >
              <span className="text-sm font-medium text-gray-200">
                {DAY_LABELS[day]}
              </span>
              <div className="flex justify-center">
                <Switch
                  checked={enabled}
                  onCheckedChange={v => updateDay(day, { enabled: v })}
                  disabled={isDisabled}
                  size="sm"
                  aria-label={`${DAY_LABELS[day]} available`}
                />
              </div>
              {enabled ? (
                <>
                  <TimeSelect
                    value={daySchedule.start}
                    onChange={v => updateDay(day, { start: v })}
                    disabled={isDisabled}
                    aria-label={`${DAY_LABELS[day]} start`}
                  />
                  <TimeSelect
                    value={daySchedule.end}
                    onChange={v => updateDay(day, { end: v })}
                    minTime={daySchedule.start}
                    disabled={isDisabled}
                    aria-label={`${DAY_LABELS[day]} end`}
                  />
                </>
              ) : (
                <span className="text-sm text-gray-500 col-span-2">
                  Unavailable
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: flat list of day rows (no nested cards), single card contains all */}
      <div className="md:hidden">
        {DAY_KEYS.map(day => {
          const daySchedule = schedule[day];
          const enabled = daySchedule.enabled;
          return (
            <div
              key={day}
              className={`border-b border-white/10 last:border-b-0 ${!enabled ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-white w-24 shrink-0">
                  {DAY_LABELS[day]}
                </span>
                <Switch
                  checked={enabled}
                  onCheckedChange={v => updateDay(day, { enabled: v })}
                  disabled={isDisabled}
                  size="sm"
                  aria-label={`${DAY_LABELS[day]} available`}
                />
                {!enabled && (
                  <span className="text-sm text-gray-500">Unavailable</span>
                )}
              </div>

              {enabled && (
                <div className="px-4 pb-3 pt-0 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">
                      Start
                    </span>
                    <TimeSelect
                      value={daySchedule.start}
                      onChange={v => updateDay(day, { start: v })}
                      disabled={isDisabled}
                      aria-label={`${DAY_LABELS[day]} start`}
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">
                      End
                    </span>
                    <TimeSelect
                      value={daySchedule.end}
                      onChange={v => updateDay(day, { end: v })}
                      minTime={daySchedule.start}
                      disabled={isDisabled}
                      aria-label={`${DAY_LABELS[day]} end`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
