'use client';

import { US_PHONE_DIGIT_COUNT, formatUsPhoneDigits } from '@/lib/formatUsPhone';
import { PhoneIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Input } from './Input';

const PHONE_FORMATTED_MAX_LENGTH = 14;

export { US_PHONE_DIGIT_COUNT, formatUsPhoneDigits };

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
  /** When true, show a phone icon inside the input (left side). */
  showIcon?: boolean;
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
  showIcon = false,
}) => {
  const digits = value.replace(/\D/g, '').slice(0, US_PHONE_DIGIT_COUNT);
  const [displayValue, setDisplayValue] = useState(() =>
    formatUsPhoneDigits(digits)
  );

  useEffect(() => {
    setDisplayValue(formatUsPhoneDigits(value.replace(/\D/g, '')));
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, US_PHONE_DIGIT_COUNT);
    setDisplayValue(formatUsPhoneDigits(cleaned));
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
        leftIcon={showIcon ? <PhoneIcon className="h-5 w-5" /> : undefined}
      />
      {showDigitHint && digitCount > 0 && digitCount < US_PHONE_DIGIT_COUNT && (
        <p className="mt-1 text-sm text-gray-400">
          {US_PHONE_DIGIT_COUNT - digitCount} more digit
          {digitCount === 9 ? '' : 's'} needed
        </p>
      )}
    </div>
  );
};
