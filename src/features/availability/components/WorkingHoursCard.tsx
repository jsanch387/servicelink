'use client';

import React from 'react';
import type { WeeklySchedule } from '../types/availability';
import type { PresetKey } from './QuickPresetsSection';
import { QuickPresetsSection } from './QuickPresetsSection';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';

interface WorkingHoursCardProps {
  schedule: WeeklySchedule;
  onScheduleChange: (schedule: WeeklySchedule) => void;
  selectedPreset: PresetKey | null;
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
      <section className="p-4 sm:p-6 border-b border-white/10">
        <QuickPresetsSection
          selectedPreset={selectedPreset}
          onSelectPreset={onSelectPreset}
          disabled={disabled}
        />
      </section>

      <section className="border-b border-white/10 last:border-b-0">
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
