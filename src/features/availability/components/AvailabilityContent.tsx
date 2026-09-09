'use client';

import { Button, toast } from '@/components/shared';
import React, { useCallback, useEffect, useState } from 'react';
import { useAvailability } from '../hooks/useAvailability';
import { useAvailabilityBookingStore } from '../stores/availabilityBookingStore';
import {
  parseStoredTimeOffBlocks,
  type BlockTimeEntry,
} from '../types/blockTime';
import {
  DEFAULT_SCHEDULE,
  SELECTED_PRESET_VALUES,
  isMinimumNoticeValue,
  type BufferTimeValue,
  type MinimumNoticeValue,
  type WeeklySchedule,
} from '../types/availability';
import { resolveBufferTimeValue } from '../utils/bufferTime';
import {
  PRESET_MON_FRI_9_5,
  PRESET_MON_SAT_8_6,
  PRESET_WEEKENDS_ONLY,
} from '../utils/presets';
import { BlockTimeSection } from './BlockTimeSection';
import { BufferTimeSection } from './BufferTimeSection';
import { LeadTimeSection } from './LeadTimeSection';
import { MasterToggleSection } from './MasterToggleSection';
import type { PresetKey } from './QuickPresetsSection';
import { WorkingHoursCard } from './WorkingHoursCard';

type AvailabilityTab = 'schedule' | 'settings';

const AVAILABILITY_TABS: { id: AvailabilityTab; label: string }[] = [
  { id: 'schedule', label: 'Your schedule' },
  { id: 'settings', label: 'Settings' },
];

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
  const [bufferTime, setBufferTime] = useState<BufferTimeValue>('none');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(
    'mon_fri_9_5'
  );
  const [saving, setSaving] = useState(false);
  const [timeOffBlocks, setTimeOffBlocks] = useState<BlockTimeEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AvailabilityTab>('schedule');

  // Sync from API when data loads: no row = toggle off (first-time); has row = apply saved values
  useEffect(() => {
    if (loading) return;
    if (!availabilityData) {
      setAcceptBookings(false);
      setMinimumNotice('none');
      setBufferTime('none');
      setTimeOffBlocks([]);
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
    setMinimumNotice(
      isMinimumNoticeValue(availabilityData.minimum_notice)
        ? availabilityData.minimum_notice
        : 'none'
    );
    setBufferTime(resolveBufferTimeValue(availabilityData.buffer_time));
    setTimeOffBlocks(
      parseStoredTimeOffBlocks(availabilityData.time_off_blocks)
    );
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

  const handleLeadTimeChange = useCallback((value: MinimumNoticeValue) => {
    setMinimumNotice(value);
  }, []);

  const handleBufferTimeChange = useCallback((value: BufferTimeValue) => {
    setBufferTime(value);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptBookings,
          schedule,
          minimumNotice,
          bufferTime,
          selectedPreset,
          timeOffBlocks,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to save availability');
        return;
      }
      toast.success('Availability saved');
      if (json.data) updateFromSave(json.data);
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  }, [
    acceptBookings,
    schedule,
    minimumNotice,
    bufferTime,
    selectedPreset,
    timeOffBlocks,
    updateFromSave,
  ]);

  if (loading) {
    return (
      <main className="flex flex-col flex-1 min-h-screen bg-[var(--dashboard-bg)]">
        <div className="flex-1 overflow-y-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="h-12 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-36 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-4 w-64 bg-white/10 rounded-lg animate-pulse" />
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
          {isFirstTime && (
            <div className="mb-6 sm:mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200/90">
                Open Settings and turn on Accept Bookings. When it’s on,
                customers can book based on the schedule you set for each day.
              </p>
            </div>
          )}

          <div className="space-y-6 sm:space-y-8">
            <div
              role="tablist"
              aria-label="Availability sections"
              className="flex w-full p-1.5 rounded-xl border border-white/10"
            >
              {AVAILABILITY_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'schedule' ? (
              <div>
                <div className="mb-4 sm:mb-5">
                  <h1 className="text-lg font-semibold text-white">
                    Your schedule
                  </h1>
                  <p className="mt-0.5 max-w-xl text-sm text-gray-500">
                    The dates and times you accept bookings.
                  </p>
                </div>
                <div className={acceptBookings ? '' : 'opacity-50'}>
                  <WorkingHoursCard
                    schedule={schedule}
                    onScheduleChange={handleScheduleChange}
                    selectedPreset={selectedPreset}
                    onSelectPreset={handlePresetSelect}
                    disabled={!acceptBookings}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <MasterToggleSection
                  acceptBookings={acceptBookings}
                  onToggle={handleToggle}
                />
                <div
                  className={`space-y-6 sm:space-y-8 ${
                    acceptBookings ? '' : 'opacity-50'
                  }`}
                >
                  <BlockTimeSection
                    entries={timeOffBlocks}
                    onEntriesChange={setTimeOffBlocks}
                    disabled={!acceptBookings}
                  />
                  <LeadTimeSection
                    value={minimumNotice}
                    onChange={handleLeadTimeChange}
                    disabled={!acceptBookings}
                  />
                  <BufferTimeSection
                    value={bufferTime}
                    onChange={handleBufferTimeChange}
                    disabled={!acceptBookings}
                  />
                </div>
              </div>
            )}
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
            {saving ? 'Saving' : 'Save availability'}
          </Button>
        </div>
      </div>
    </main>
  );
};
