'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  required = false,
  error,
  disabled = false,
  className = '',
  name,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Format date as MM/DD/YYYY
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';

    // If it's already in YYYY-MM-DD format (from date input)
    if (dateString.includes('-')) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
    }

    // If it's already formatted, return as is
    return dateString;
  };

  // Parse MM/DD/YYYY to YYYY-MM-DD for date input
  const parseToDateInput = (formatted: string): string => {
    if (!formatted) return '';

    // If already in YYYY-MM-DD format
    if (formatted.includes('-')) {
      return formatted;
    }

    // Parse MM/DD/YYYY
    const parts = formatted.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      if (month && day && year && year.length === 4) {
        return `${year}-${month}-${day}`;
      }
    }

    return '';
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const formatted = formatDate(dateValue);
      setDisplayValue(formatted);
      onChange(formatted);
    } else {
      setDisplayValue('');
      onChange('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove non-numeric and non-slash characters
    input = input.replace(/[^\d/]/g, '');

    // Auto-format as user types
    if (input.length <= 2) {
      setDisplayValue(input);
    } else if (input.length <= 5) {
      // Add slash after month
      if (input.length === 3 && !input.includes('/')) {
        input = input.slice(0, 2) + '/' + input.slice(2);
      }
      setDisplayValue(input);
    } else if (input.length <= 10) {
      // Add slash after day
      if (input.length === 6 && input.split('/').length === 2) {
        input = input.slice(0, 5) + '/' + input.slice(5);
      }
      setDisplayValue(input);
    }

    onChange(input);
  };

  // Update display value when value prop changes
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatDate(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const dateInputValue = parseToDateInput(displayValue);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* Native date picker (hidden, used for mobile) */}
        <input
          type="date"
          value={dateInputValue}
          onChange={handleDateChange}
          required={required}
          disabled={disabled}
          name={name}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          min={new Date().toISOString().split('T')[0]} // Prevent past dates
        />

        {/* Visible text input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={displayValue}
            onChange={handleTextChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={10}
            className={`
              w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
              transition-all duration-200 touch-manipulation
              ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
              ${disabled ? 'opacity-60 cursor-not-allowed bg-white/3' : 'hover:border-white/20 active:bg-white/8'}
            `}
          />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
