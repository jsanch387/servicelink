'use client';

import { ClockIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { WeeklySchedule } from '../types/availability';
import type { PresetKey } from './QuickPresetsSection';
import { QuickPresetsSection } from './QuickPresetsSection';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';

interface WorkingHoursCardProps {
  schedule: WeeklySchedule;
  // eslint-disable-next-line no-unused-vars -- callback type
  onScheduleChange: (schedule: WeeklySchedule) => void;
  selectedPreset: PresetKey | null;
  // eslint-disable-next-line no-unused-vars -- callback type
  onSelectPreset: (preset: PresetKey) => void;
  disabled?: boolean;
}

export const WorkingHoursCard: React.FC<WorkingHoursCardProps> = ({
  schedule,
  onScheduleChange,
  selectedPreset,
  onSelectPreset,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Presets */}
      <section className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <ClockIcon className="h-5 w-5 text-gray-400 shrink-0" aria-hidden />
          <h2 className="font-semibold text-lg text-white">Working Hours</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4 sm:mb-5">
          Pick a preset or set times for each day.
        </p>
        <QuickPresetsSection
          selectedPreset={selectedPreset}
          onSelectPreset={onSelectPreset}
          disabled={disabled}
        />
      </section>

      {/* Schedule */}
      <section className="border-b border-white/10 last:border-b-0">
        <div className="px-4 pt-4 pb-1 sm:px-4 sm:pt-6">
          <h3 className="text-sm font-medium text-gray-400">Weekly schedule</h3>
        </div>
        <WeeklyScheduleGrid
          schedule={schedule}
          onChange={onScheduleChange}
          disabled={disabled}
        />
      </section>

      <footer className="px-4 sm:px-6 py-3 sm:py-4 bg-white/[0.02]">
        <p className="text-xs text-gray-500">
          All times in your local timezone
        </p>
      </footer>
    </div>
  );
};
