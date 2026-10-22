import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { fieldBoxClassName, fieldLabelClassName } from './fieldStyles';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string; // Used in component - see line 44
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  error,
  disabled = false,
  className = '',
  name,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={fieldLabelClassName}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          name={name}
          className={`
            w-full appearance-none pr-8 text-base touch-manipulation sm:text-sm
            ${fieldBoxClassName}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'hover:border-white/25'}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${value ? 'text-white' : 'text-gray-500'}
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
