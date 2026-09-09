'use client';

import { Select } from '@/components/shared';
import React from 'react';
import {
  MINIMUM_NOTICE_OPTIONS,
  type MinimumNoticeValue,
} from '../types/availability';
import { AvailabilitySettingInfo } from './AvailabilitySettingInfo';

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
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-semibold text-lg text-white">Lead time</h2>
          <AvailabilitySettingInfo title="What is lead time?">
            <p>Lead time is how far ahead a customer has to book.</p>
            <p>
              If you set 2 hours, they can’t grab a slot that starts in 20
              minutes. They have to pick a time that’s at least 2 hours from
              now.
            </p>
            <p>
              That’s it — it stops last-minute bookings from surprising you.
            </p>
          </AvailabilitySettingInfo>
        </div>
        <p className="text-sm text-gray-400 mb-4 sm:mb-5">
          How far ahead customers have to book.
        </p>
        <div className="w-full sm:max-w-xs">
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
