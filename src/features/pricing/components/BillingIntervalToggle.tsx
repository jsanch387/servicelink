'use client';

import React from 'react';
import type { BillingInterval } from '../types';
import { PRO_YEARLY_SAVINGS_LABEL } from '../types';

export interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

const options: { id: BillingInterval; label: string; badge?: string }[] = [
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly', badge: PRO_YEARLY_SAVINGS_LABEL },
];

/**
 * Monthly / yearly pill toggle for public pricing and upgrade flows.
 */
export const BillingIntervalToggle: React.FC<BillingIntervalToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 ${className}`.trim()}
      role="group"
      aria-label="Billing interval"
    >
      {options.map(option => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              selected
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{option.label}</span>
            {option.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  selected
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {option.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
