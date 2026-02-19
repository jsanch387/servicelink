'use client';

import React, { useEffect, useState } from 'react';
import { Input } from './Input';

/** US phone: 10 digits → (XXX) XXX-XXXX. Formatted length = 14. */
const PHONE_DIGIT_LIMIT = 10;
const PHONE_FORMATTED_MAX_LENGTH = 14;

function formatPhoneDisplay(digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, PHONE_DIGIT_LIMIT)}`;
}

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
}

/**
 * Reusable phone input: uses shared Input for booking-flow styling,
 * auto-formats as (XXX) XXX-XXXX, and enforces a 10-digit limit.
 * Value is always stored as digits only (e.g. "5551234567").
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
}) => {
  const digits = value.replace(/\D/g, '').slice(0, PHONE_DIGIT_LIMIT);
  const [displayValue, setDisplayValue] = useState(() => formatPhoneDisplay(digits));

  useEffect(() => {
    setDisplayValue(formatPhoneDisplay(value.replace(/\D/g, '')));
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, PHONE_DIGIT_LIMIT);
    setDisplayValue(formatPhoneDisplay(cleaned));
    onChange(cleaned);
  };

  const digitCount = displayValue.replace(/\D/g, '').length;

  return (
    <div className={className}>
      <Input
        label={label}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        error={error}
        disabled={disabled}
        name={name}
        maxLength={PHONE_FORMATTED_MAX_LENGTH}
      />
      {showDigitHint && digitCount > 0 && digitCount < PHONE_DIGIT_LIMIT && (
        <p className="mt-1 text-sm text-gray-400">
          {PHONE_DIGIT_LIMIT - digitCount} more digit{digitCount === 9 ? '' : 's'} needed
        </p>
      )}
    </div>
  );
};
