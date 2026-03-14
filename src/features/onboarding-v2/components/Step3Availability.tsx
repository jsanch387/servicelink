'use client';

import { Button } from '@/components/shared';
import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';
import { WorkingHoursCard } from '@/features/availability/components/WorkingHoursCard';
import { type WeeklySchedule } from '@/features/availability/types/availability';
import {
  PRESET_MON_FRI_9_5,
  PRESET_MON_SAT_8_6,
  PRESET_WEEKENDS_ONLY,
} from '@/features/availability/utils/presets';
import React, { useCallback, useState } from 'react';

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

interface Step3AvailabilityProps {
  businessProfileId: string | undefined;
  schedule: WeeklySchedule;
  selectedPreset: PresetKey | null;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (updates: {
    schedule?: WeeklySchedule;
    selectedPreset?: PresetKey | null;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Availability: React.FC<Step3AvailabilityProps> = ({
  businessProfileId,
  schedule,
  selectedPreset,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule>(schedule);
  const [localPreset, setLocalPreset] = useState<PresetKey | null>(
    selectedPreset
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = useCallback((preset: PresetKey) => {
    setLocalPreset(preset);
    const next = getPresetSchedule(preset);
    if (next) {
      setLocalSchedule(next);
    }
  }, []);

  const handleScheduleChange = useCallback((next: WeeklySchedule) => {
    setLocalSchedule(next);
    setLocalPreset('custom');
  }, []);

  const handleNext = useCallback(async () => {
    if (!businessProfileId) {
      setError('Business profile is missing. Go back and complete step 1.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding-v2/step3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          schedule: localSchedule,
          selectedPreset: localPreset,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to save hours.');
        return;
      }
      onUpdate({ schedule: localSchedule, selectedPreset: localPreset });
      onNext();
    } finally {
      setSaving(false);
    }
  }, [businessProfileId, localSchedule, localPreset, onNext, onUpdate]);

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          When do you work?
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          Pick your usual hours. Customers will only see times when you&apos;re
          free.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="mb-8">
        <WorkingHoursCard
          schedule={localSchedule}
          onScheduleChange={handleScheduleChange}
          selectedPreset={localPreset}
          onSelectPreset={handlePresetSelect}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          variant="inverse"
          className="sm:ml-auto"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Next'}
        </Button>
      </div>
    </div>
  );
};
