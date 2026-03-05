'use client';

import React from 'react';

export interface SwitchProps {
  /** Controlled checked state */
  checked: boolean;
  /** Called when the user toggles; pass the new value */
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Size: sm (day row), md (default), lg (prominent / touch-friendly) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label (e.g. "Accept Bookings") */
  label?: React.ReactNode;
  /** Optional description below label */
  description?: React.ReactNode;
  /** Additional class for the root container when label/description are used */
  className?: string;
  /** Accessible name when no visible label */
  'aria-label'?: string;
}

const sizeConfig = {
  sm: {
    track: 'h-6 w-11',
    thumb: 'h-4 w-4',
    padding: 'p-1',
  },
  md: {
    track: 'h-7 w-12',
    thumb: 'h-5 w-5',
    padding: 'p-1',
  },
  lg: {
    track: 'h-8 w-14 sm:h-9 sm:w-16',
    thumb: 'h-6 w-6 sm:h-7 sm:w-7',
    padding: 'p-1 sm:p-1.5',
  },
} as const;

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const config = sizeConfig[size];

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full
        transition-colors duration-200 ease-out
        focus:outline-none
        disabled:cursor-not-allowed disabled:opacity-50
        ${size === 'lg' ? 'min-h-[44px] min-w-[44px]' : ''}
        ${config.track}
        ${config.padding}
        ${checked ? 'bg-emerald-500' : 'bg-neutral-600'}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shrink-0
          shadow-[0_1px_3px_rgba(0,0,0,0.3)]
          transition-[margin] duration-200 ease-out
          ${config.thumb}
          ${checked ? 'ml-auto' : 'ml-0'}
        `}
      />
    </button>
  );

  if (label != null || description != null) {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 ${className}`}
      >
        <div className="space-y-1 min-w-0">
          {label != null && (
            <span className="block text-base font-semibold text-white">
              {label}
            </span>
          )}
          {description != null && (
            <p className="block text-sm text-gray-400">{description}</p>
          )}
        </div>
        {button}
      </div>
    );
  }

  return <span className={className}>{button}</span>;
};
