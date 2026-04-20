'use client';

import React, { useState } from 'react';

export interface MoneyInputProps {
  label?: string;
  placeholder?: string;
  /** Dollar amount as digits, optional single `.` and up to two decimal places (no commas). */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
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
  label,
  placeholder = '0.00',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = '',
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
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-base sm:text-sm tabular-nums"
          aria-hidden
        >
          $
        </span>
        <input
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
          className={`
            w-full py-2.5 pl-7 pr-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-normal tabular-nums
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
            transition-all duration-200 touch-manipulation
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
            ${disabled ? 'opacity-60 cursor-not-allowed bg-white/3' : 'cursor-text hover:border-white/20 active:bg-white/8'}
          `}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
