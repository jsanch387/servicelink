'use client';

import { Button } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAvailability } from '../hooks/useAvailability';
import { useAvailabilityBookingStore } from '../stores/availabilityBookingStore';
import {
  DEFAULT_SCHEDULE,
  SELECTED_PRESET_VALUES,
  type MinimumNoticeValue,
  type WeeklySchedule,
} from '../types/availability';
import {
  PRESET_MON_FRI_9_5,
  PRESET_MON_SAT_8_6,
  PRESET_WEEKENDS_ONLY,
} from '../utils/presets';
import { MasterToggleSection } from './MasterToggleSection';
// import { MinimumNoticeSection } from './MinimumNoticeSection';
import type { PresetKey } from './QuickPresetsSection';
import { WorkingHoursCard } from './WorkingHoursCard';

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
  const {
    data: availabilityData,
    loading,
    error,
    updateFromSave,
  } = useAvailability();
  const acceptBookings = useAvailabilityBookingStore(s => s.acceptBookings);
  const setAcceptBookings = useAvailabilityBookingStore(
    s => s.setAcceptBookings
  );
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => ({
    ...DEFAULT_SCHEDULE,
  }));
  const [minimumNotice, setMinimumNotice] =
    useState<MinimumNoticeValue>('none');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(
    'mon_fri_9_5'
  );
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from API when data loads: no row = toggle off (first-time); has row = apply saved values
  useEffect(() => {
    if (loading) return;
    if (!availabilityData) {
      setAcceptBookings(false);
      return;
    }
    setAcceptBookings(availabilityData.accept_bookings);
    setSchedule(availabilityData.weekly_schedule ?? { ...DEFAULT_SCHEDULE });
    const preset =
      availabilityData.selected_preset &&
      SELECTED_PRESET_VALUES.includes(
        availabilityData.selected_preset as (typeof SELECTED_PRESET_VALUES)[number]
      )
        ? (availabilityData.selected_preset as PresetKey)
        : 'custom';
    setSelectedPreset(preset);
    const notice = availabilityData.minimum_notice as MinimumNoticeValue;
    if (['none', '1h', '2h', '4h', '24h'].includes(notice)) {
      setMinimumNotice(notice);
    }
  }, [loading, availabilityData, setAcceptBookings]);

  const handlePresetSelect = useCallback((preset: PresetKey) => {
    setSelectedPreset(preset);
    const next = getPresetSchedule(preset);
    if (next) setSchedule(next);
  }, []);

  const handleScheduleChange = useCallback((next: WeeklySchedule) => {
    setSchedule(next);
    setSelectedPreset('custom');
  }, []);

  const handleToggle = useCallback(
    (value: boolean) => {
      setAcceptBookings(value);
    },
    [setAcceptBookings]
  );

  // Used when MinimumNoticeSection is enabled
  // const handleMinimumNoticeChange = useCallback((value: MinimumNoticeValue) => {
  //   setMinimumNotice(value);
  // }, []);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptBookings,
          schedule,
          minimumNotice,
          selectedPreset,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save');
        return;
      }
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      setShowSaved(true);
      savedTimeoutRef.current = setTimeout(() => {
        setShowSaved(false);
        savedTimeoutRef.current = null;
      }, 2000);
      if (json.data) updateFromSave(json.data);
    } catch {
      setSaveError('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [acceptBookings, schedule, minimumNotice, selectedPreset, updateFromSave]);

  if (loading) {
    return (
      <main className="flex flex-col flex-1 min-h-screen bg-[var(--dashboard-bg)]">
        <div className="flex-1 overflow-y-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 sm:mb-8 md:mb-10">
              <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-4 w-64 mt-2 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 animate-pulse">
                <div className="h-5 w-48 bg-white/10 rounded mb-4" />
                <div className="h-12 w-24 bg-white/10 rounded-xl" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 animate-pulse">
                <div className="h-5 w-32 bg-white/10 rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="h-12 bg-white/5 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col flex-1 min-h-screen bg-[var(--dashboard-bg)]">
        <div className="flex-1 overflow-y-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const isFirstTime = availabilityData === null;

  return (
    <main className="flex flex-col flex-1 min-h-screen bg-[var(--dashboard-bg)]">
      <div className="flex-1 overflow-y-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 pb-24">
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

          {isFirstTime && (
            <div className="mb-6 sm:mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200/90">
                Turn on the toggle below to accept bookings. When it’s on,
                customers can book based on the schedule you set for each day.
              </p>
            </div>
          )}

          {saveError && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-200/90">{saveError}</p>
            </div>
          )}

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

            {/* Minimum notice – commented out for now */}
            {/* <div className={acceptBookings ? '' : 'opacity-50'}>
              <MinimumNoticeSection
                value={minimumNotice}
                onChange={handleMinimumNoticeChange}
                disabled={!acceptBookings}
              />
            </div> */}
          </div>
        </div>
      </div>

      {/* Sticky Save button at bottom */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <Button
            type="button"
            onClick={handleSave}
            variant="inverse"
            fullWidth
            className="font-semibold"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save availability'}
          </Button>
        </div>
      </div>
    </main>
  );
};
