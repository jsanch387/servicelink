'use client';

import { Button, PriceInput, Select, TimeSelect } from '@/components/shared';
import React, { useState } from 'react';

const FREQUENCY_OPTIONS = [
  { value: '2', label: 'Every 2 weeks' },
  { value: '3', label: 'Every 3 weeks' },
  { value: '4', label: 'Every 4 weeks' },
  { value: '6', label: 'Every 6 weeks' },
  { value: '8', label: 'Every 8 weeks' },
] as const;

interface EnrollMaintenanceModalBodyProps {
  customerName: string;
  onClose: () => void;
}

/**
 * CRM enrollment UI for recurring maintenance (preview — no persistence yet).
 */
export function EnrollMaintenanceModalBody({
  customerName,
  onClose,
}: EnrollMaintenanceModalBodyProps) {
  const [priceDigits, setPriceDigits] = useState('');
  const [frequencyWeeks, setFrequencyWeeks] = useState('');
  const [visitDurationHHmm, setVisitDurationHHmm] = useState('');
  const [anchorDate, setAnchorDate] = useState('');
  const [anchorTime, setAnchorTime] = useState('10:00');

  const canSubmitEnroll = visitDurationHHmm.trim() !== '';

  return (
    <div className="space-y-5 lg:space-y-6">
      <p className="text-sm leading-relaxed text-gray-400 lg:text-[15px] lg:leading-relaxed">
        {`Put this customer on a `}
        <span className="font-medium text-gray-300">maintenance detail</span>
        {`—regular upkeep after they've already been detailed by you. Set price, schedule, and visit length below.`}
      </p>

      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:space-y-0">
        <div className="lg:col-span-2">
          <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
            Customer
          </label>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 lg:rounded-2xl lg:border-white/[0.1] lg:bg-gradient-to-b lg:from-white/[0.06] lg:to-white/[0.02] lg:px-4 lg:py-3.5">
            <p className="text-sm font-semibold text-white">{customerName}</p>
          </div>
        </div>

        <div className="min-w-0">
          <PriceInput
            label="Price per visit"
            placeholder="e.g. 100"
            value={priceDigits}
            onChange={setPriceDigits}
          />
        </div>

        <div className="min-w-0">
          <Select
            label="Frequency"
            placeholder="How often"
            value={frequencyWeeks}
            onChange={setFrequencyWeeks}
            options={[...FREQUENCY_OPTIONS]}
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
            Visit duration
          </label>
          <TimeSelect
            variant="duration"
            value={visitDurationHHmm}
            onChange={setVisitDurationHHmm}
            durationPlaceholder="Select duration"
            aria-label="Select visit duration"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:col-span-2 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0">
            <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
              Preferred date
            </label>
            <input
              type="date"
              value={anchorDate}
              onChange={e => setAnchorDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark] lg:rounded-xl"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
              Preferred time
            </label>
            <input
              type="time"
              value={anchorTime}
              onChange={e => setAnchorTime(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark] lg:rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:border-t lg:border-white/10 lg:pt-6">
        <p className="text-xs text-gray-500 lg:text-[13px]">
          Preview only — nothing is saved to your account yet.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={!canSubmitEnroll}
            className="text-sm font-semibold lg:min-w-[160px]"
          >
            Enroll customer
          </Button>
        </div>
      </div>
    </div>
  );
}
