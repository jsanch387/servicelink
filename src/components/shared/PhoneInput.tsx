'use client';

import {
  US_PHONE_COUNTRY_CODE,
  US_PHONE_DIGIT_COUNT,
  formatUsPhoneDigits,
  normalizeUsPhoneDigits,
} from '@/lib/formatUsPhone';
import React, { useEffect, useId, useState } from 'react';

const PHONE_FORMATTED_MAX_LENGTH = 14;

export {
  US_PHONE_COUNTRY_CODE,
  US_PHONE_DIGIT_COUNT,
  formatUsPhoneDigits,
  normalizeUsPhoneDigits,
};

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  /** When true, show a hint like "X more digits needed" under the field. */
  showDigitHint?: boolean;
  /** @deprecated US +1 prefix is always shown; kept for call-site compat. */
  showIcon?: boolean;
  onBlur?: () => void;
}

/**
 * US phone input: locked +1 country prefix, formats as (XXX) XXX-XXXX.
 * Value is always stored as 10 national digits (e.g. "5807545207").
 * SMS layer adds +1 via toE164 / toUsE164.
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone',
  value,
  onChange,
  placeholder = '(555) 123-4567',
  required = false,
  error,
  disabled = false,
  className = '',
  name,
  showDigitHint = true,
  onBlur,
}) => {
  const inputId = useId();
  const [displayValue, setDisplayValue] = useState(() =>
    formatUsPhoneDigits(normalizeUsPhoneDigits(value))
  );

  useEffect(() => {
    const normalized = normalizeUsPhoneDigits(value);
    setDisplayValue(formatUsPhoneDigits(normalized));
    const rawDigits = value.replace(/\D/g, '');
    if (rawDigits.length >= 11 && rawDigits.startsWith('1') && normalized) {
      onChange(normalized);
    }
    // Intentionally only re-sync when `value` changes (not onChange identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- normalize country-code prefill
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = normalizeUsPhoneDigits(raw);
    setDisplayValue(formatUsPhoneDigits(cleaned));
    onChange(cleaned);
  };

  const digitCount = displayValue.replace(/\D/g, '').length;

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-left text-sm font-medium text-gray-200"
        >
          {label}
          {required ? <span className="ml-1 text-red-400">*</span> : null}
        </label>
      ) : null}

      <div
        className={`
          flex h-11 items-stretch overflow-hidden rounded-lg border bg-white/5
          transition-all duration-200
          focus-within:border-white/30 focus-within:bg-white/8 focus-within:ring-2 focus-within:ring-white/20
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-white/20'}
        `}
      >
        <div
          className="flex shrink-0 items-center gap-1.5 border-r border-white/10 bg-white/[0.03] px-3"
          title="United States (+1)"
          aria-hidden
        >
          <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-zinc-200">
            US
          </span>
          <span className="text-sm font-semibold tabular-nums text-zinc-300">
            +{US_PHONE_COUNTRY_CODE}
          </span>
        </div>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          name={name}
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={PHONE_FORMATTED_MAX_LENGTH}
          aria-label={
            label ? `${label}, United States` : 'Phone, United States'
          }
          className="min-w-0 flex-1 bg-transparent px-3.5 text-base text-white placeholder-gray-500 outline-none sm:text-sm"
        />
      </div>

      {error ? (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      ) : showDigitHint &&
        digitCount > 0 &&
        digitCount < US_PHONE_DIGIT_COUNT ? (
        <p className="mt-1 text-sm text-gray-400">
          {US_PHONE_DIGIT_COUNT - digitCount} more digit
          {digitCount === 9 ? '' : 's'} needed
        </p>
      ) : null}
    </div>
  );
};
