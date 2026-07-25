'use client';

import { Select } from '@/components/shared';
import { ForwardIcon } from '@heroicons/react/24/outline';
import React from 'react';
import {
  MINIMUM_NOTICE_OPTIONS,
  type MinimumNoticeValue,
} from '../types/availability';

interface LeadTimeSectionProps {
  value: MinimumNoticeValue;
  onChange: (value: MinimumNoticeValue) => void;
  disabled?: boolean;
}

export const LeadTimeSection: React.FC<LeadTimeSectionProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <section className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <ForwardIcon className="h-5 w-5 text-gray-400 shrink-0" aria-hidden />
          <h2 className="font-semibold text-lg text-white">Lead time</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4 sm:mb-5">
          Stop last-minute bookings. Customers have to book at least this far
          ahead.
        </p>
        <div className="w-full max-w-xs">
          <Select
            value={value}
            onChange={v => onChange(v as MinimumNoticeValue)}
            options={MINIMUM_NOTICE_OPTIONS}
            disabled={disabled}
          />
        </div>
      </section>
    </div>
  );
};
