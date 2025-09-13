'use client';

import React, { useState, useEffect } from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '(555) 123-4567',
  required = false,
  error,
  disabled = false,
  className = '',
  name,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number as user types
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, '');

    // Format based on length
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Validate phone number
  const validatePhoneNumber = (
    phone: string
  ): { isValid: boolean; error?: string } => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }

    if (cleaned.length !== 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }

    return { isValid: true };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);

    // Only allow up to 10 digits
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setDisplayValue(formatted);
      onChange(cleaned); // Store clean number without formatting
    }
  };

  const handleBlur = () => {
    // Validate on blur
    const validation = validatePhoneNumber(value);
    if (!validation.isValid && value.length > 0) {
      console.log('📞 Phone validation error:', validation.error);
    }
  };

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <PhoneIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="tel"
          inputMode="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          name={name}
          className={`
            w-full pl-10 pr-4 py-3 bg-neutral-800 border rounded-md text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-500' : 'border-neutral-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-500'}
          `}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {/* Phone number validation hint */}
      {value.length > 0 && value.length < 10 && (
        <p className="mt-1 text-sm text-gray-400">
          {10 - value.length} more digits needed
        </p>
      )}
    </div>
  );
};
