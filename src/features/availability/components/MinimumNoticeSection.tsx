'use client';

import { Select } from '@/components/shared';
import React from 'react';
import type { MinimumNoticeValue } from '../types/availability';

const OPTIONS: { value: MinimumNoticeValue; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '4h', label: '4 hours' },
  { value: '24h', label: '24 hours' },
];

interface MinimumNoticeSectionProps {
  value: MinimumNoticeValue;

  onChange: (value: MinimumNoticeValue) => void;
  disabled?: boolean;
}

export const MinimumNoticeSection: React.FC<MinimumNoticeSectionProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 md:p-8">
      <h2 className="text-base font-semibold text-white">
        Minimum Notice Required
      </h2>
      <div className="mt-4 w-full max-w-xs">
        <Select
          value={value}
          onChange={v => onChange(v as MinimumNoticeValue)}
          options={OPTIONS}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
