'use client';

import {
  DEFAULT_SCHEDULE,
  type MinimumNoticeValue,
  type WeeklySchedule,
} from '../types/availability';
import {
  PRESET_MON_FRI_9_5,
  PRESET_MON_SAT_8_6,
  PRESET_WEEKENDS_ONLY,
} from '../utils/presets';
import type { PresetKey } from './QuickPresetsSection';
import { Button } from '@/components/shared';
import { MasterToggleSection } from './MasterToggleSection';
import { WorkingHoursCard } from './WorkingHoursCard';
import { MinimumNoticeSection } from './MinimumNoticeSection';
import React, { useCallback, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

function getPresetSchedule(preset: PresetKey): WeeklySchedule | null {
  switch (preset) {
    case 'mon_fri_9_5':
      return JSON.parse(JSON.stringify(PRESET_MON_FRI_9_5));
    case 'mon_sat_8_6':
      return JSON.parse(JSON.stringify(PRESET_MON_SAT_8_6));
    case 'weekends_only':
      return JSON.parse(JSON.stringify(PRESET_WEEKENDS_ONLY));
    case 'custom':
    default:
      return null;
  }
}

export const AvailabilityContent: React.FC = () => {
  const [acceptBookings, setAcceptBookings] = useState(true);
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => ({
    ...DEFAULT_SCHEDULE,
  }));
  const [minimumNotice, setMinimumNotice] =
    useState<MinimumNoticeValue>('none');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(
    'mon_fri_9_5'
  );
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePresetSelect = useCallback((preset: PresetKey) => {
    setSelectedPreset(preset);
    const next = getPresetSchedule(preset);
    if (next) setSchedule(next);
  }, []);

  const handleScheduleChange = useCallback((next: WeeklySchedule) => {
    setSchedule(next);
    setSelectedPreset('custom');
  }, []);

  const handleToggle = useCallback((value: boolean) => {
    setAcceptBookings(value);
  }, []);

  const handleMinimumNoticeChange = useCallback((value: MinimumNoticeValue) => {
    setMinimumNotice(value);
  }, []);

  const handleSave = useCallback(() => {
    const payload = {
      acceptBookings,
      schedule,
      minimumNotice,
    };
    console.log('Availability update (backend payload):', payload);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    setShowSaved(true);
    savedTimeoutRef.current = setTimeout(() => {
      setShowSaved(false);
      savedTimeoutRef.current = null;
    }, 2000);
  }, [acceptBookings, schedule, minimumNotice]);

  return (
    <main className="flex-1 py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-2xl mx-auto relative">
        {/* Subtle Saved indicator — stays in flow on small screens */}
        {showSaved && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-emerald-500 text-xs sm:text-sm">
            <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Saved</span>
          </div>
        )}

        <div className="mb-6 sm:mb-8 md:mb-10 pr-16 sm:pr-20">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
            Availability
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Set when you’re available for bookings
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <MasterToggleSection
            acceptBookings={acceptBookings}
            onToggle={handleToggle}
          />

          <div className={acceptBookings ? '' : 'opacity-50'}>
            <WorkingHoursCard
              schedule={schedule}
              onScheduleChange={handleScheduleChange}
              selectedPreset={selectedPreset}
              onSelectPreset={handlePresetSelect}
              disabled={!acceptBookings}
            />
          </div>

          <div className={acceptBookings ? '' : 'opacity-50'}>
            <MinimumNoticeSection
              value={minimumNotice}
              onChange={handleMinimumNoticeChange}
              disabled={!acceptBookings}
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSave}
              variant="inverse"
              size="lg"
              fullWidth
              className="font-semibold"
            >
              Save availability
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
