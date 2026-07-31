'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';
import type { CreateAppointmentLocationType } from '../types';

export interface LocationStepProps {
  value: CreateAppointmentLocationType | null;
  onChange: (value: CreateAppointmentLocationType) => void;
  shopAddressMissing?: boolean;
}

const OPTIONS: Array<{
  id: CreateAppointmentLocationType;
  title: string;
  description: string;
}> = [
  {
    id: 'mobile',
    title: 'Mobile',
    description: 'You go to the customer. You’ll enter their address next.',
  },
  {
    id: 'shop',
    title: 'Shop',
    description: 'They come to your shop. No address entry needed.',
  },
];

export function LocationStep({
  value,
  onChange,
  shopAddressMissing = false,
}: LocationStepProps) {
  return (
    <div className="space-y-3">
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label="Service location"
      >
        {OPTIONS.map(option => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {option.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  {option.description}
                </span>
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? 'border-white/40 bg-white/20'
                    : 'border-white/20 bg-transparent'
                }`}
                aria-hidden
              >
                {selected ? (
                  <CheckIcon className="h-3.5 w-3.5 text-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {value === 'shop' && shopAddressMissing ? (
        <p className="text-sm text-amber-300/90">
          Add your shop address in Business profile before booking shop visits.
        </p>
      ) : null}
    </div>
  );
}
