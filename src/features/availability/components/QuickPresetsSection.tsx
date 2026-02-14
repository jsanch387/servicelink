'use client';

import React from 'react';

export type PresetKey =
  | 'mon_fri_9_5'
  | 'mon_sat_8_6'
  | 'weekends_only'
  | 'custom';

interface QuickPresetsSectionProps {
  selectedPreset: PresetKey | null;
  // eslint-disable-next-line no-unused-vars
  onSelectPreset: (_preset: PresetKey) => void;
  disabled?: boolean;
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'mon_fri_9_5', label: 'Mon–Fri 9–5' },
  { key: 'mon_sat_8_6', label: 'Mon–Sat 8–6' },
  { key: 'weekends_only', label: 'Weekends' },
  { key: 'custom', label: 'Custom' },
];

export const QuickPresetsSection: React.FC<QuickPresetsSectionProps> = ({
  selectedPreset,
  onSelectPreset,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelectPreset(key)}
          disabled={disabled}
          className={`
            rounded-xl py-3 px-4 text-sm font-medium
            border transition-all duration-150
            min-h-[48px] flex items-center justify-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
            ${
              selectedPreset === key
                ? 'bg-white border-white/40 text-black'
                : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08] hover:border-white/15 hover:text-white'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
