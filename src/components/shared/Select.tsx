import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string; // Used in component - see line 44
  // eslint-disable-next-line no-unused-vars
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
        <label className="block text-left text-sm font-semibold text-gray-200 mb-2.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
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
            w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
            transition-all duration-200 appearance-none touch-manipulation
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 active:bg-white/8 cursor-pointer'}
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
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
