'use client';

import { Select } from '@/components/shared';
import React from 'react';
import {
  BUFFER_TIME_OPTIONS,
  type BufferTimeValue,
} from '../types/availability';
import { AvailabilitySettingInfo } from './AvailabilitySettingInfo';

interface BufferTimeSectionProps {
  value: BufferTimeValue;
  onChange: (value: BufferTimeValue) => void;
  disabled?: boolean;
}

export const BufferTimeSection: React.FC<BufferTimeSectionProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <section className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-semibold text-lg text-white">Buffer time</h2>
          <AvailabilitySettingInfo title="What is buffer time?">
            <p>Buffer time is a gap you keep between appointments.</p>
            <p>
              Say you finish at 10:00 and you set a 30-minute buffer. The next
              customer can’t book 10:00. The first time they can book is 10:30.
            </p>
            <p>
              Use it for drive time, cleanup, or a short break. If you don’t
              have a booking yet, it doesn’t change anything.
            </p>
          </AvailabilitySettingInfo>
        </div>
        <p className="text-sm text-gray-400 mb-4 sm:mb-5">
          A gap between your appointments.
        </p>
        <div className="w-full sm:max-w-xs">
          <Select
            value={value}
            onChange={v => onChange(v as BufferTimeValue)}
            options={BUFFER_TIME_OPTIONS}
            disabled={disabled}
          />
        </div>
      </section>
    </div>
  );
};
