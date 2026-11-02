'use client';

import React, { useState } from 'react';
import { fieldBoxClassName, fieldLabelClassName } from './fieldStyles';

export interface MoneyInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  /** Dollar amount as digits, optional single `.` and up to two decimal places (no commas). */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** Keep only valid money characters: digits and at most one decimal with ≤2 fractional digits. */
function sanitizeMoneyInput(raw: string): string {
  const s = raw.replace(/[^0-9.]/g, '');
  if (s === '') return '';

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    return s;
  }

  let intPart = s.slice(0, firstDot).replace(/\./g, '');
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  if (intPart === '') intPart = '0';

  if (s.endsWith('.') && decPart.length === 0) {
    return `${intPart}.`;
  }

  return decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
}

function formatBlurredDisplay(raw: string): string {
  if (raw === '' || raw === '.') return '';
  if (raw.endsWith('.')) {
    const n = parseFloat(raw.slice(0, -1));
    if (Number.isNaN(n)) return raw;
    return `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`;
  }
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  id,
  label,
  placeholder = '0.00',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [focused, setFocused] = useState(false);

  const displayValue = focused ? value : formatBlurredDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeMoneyInput(e.target.value);
    onChange(next);
  };

  const handleBlur = () => {
    setFocused(false);
    if (value.endsWith('.')) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={fieldLabelClassName}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm tabular-nums text-white/40"
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel ?? (id || label ? undefined : 'Amount')}
          className={`
            w-full text-base text-white placeholder:text-white/40 sm:text-sm tabular-nums touch-manipulation
            ${fieldBoxClassName}
            !pl-7
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/15'}
            ${
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-text hover:border-white/25'
            }
          `}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
};
