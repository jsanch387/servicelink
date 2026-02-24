'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useMemo } from 'react';
import { getTimeOptions } from '../utils/timeOptions';

/** Single time dropdown: one tap opens one list. Clean box styling. */
const baseSelectClass = `
  w-full min-w-0 py-3 px-4 min-h-[48px] text-base text-white font-medium
  bg-transparent border-0 rounded-xl
  focus:outline-none focus:ring-0 cursor-pointer
  appearance-none
  disabled:opacity-50 disabled:cursor-not-allowed
`;

interface CompactTimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minTime?: string;
  'aria-label'?: string;
  className?: string;
}

export const CompactTimeSelect: React.FC<CompactTimeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  minTime,
  'aria-label': ariaLabel = 'Time',
  className = '',
}) => {
  const allOptions = useMemo(() => getTimeOptions(), []);
  const options = useMemo(() => {
    const filtered = minTime
      ? allOptions.filter(o => o.value >= minTime)
      : allOptions;
    const hasValue = filtered.some(o => o.value === value);
    return hasValue ? filtered : allOptions;
  }, [allOptions, minTime, value]);

  return (
    <div
      className={`
        relative flex items-center rounded-xl border border-white/10 bg-white/5
        focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/20
        transition-all duration-150
        ${disabled ? 'opacity-60' : 'hover:border-white/15'}
        ${className}
      `}
    >
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${baseSelectClass} pr-10`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        aria-hidden
      />
    </div>
  );
};
