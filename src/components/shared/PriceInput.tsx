import React from 'react';
import { fieldBoxClassName, fieldLabelClassName } from './fieldStyles';

interface PriceInputProps {
  label?: string;
  placeholder?: string;
  value: string;

  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  label,
  placeholder = 'Enter price',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(numericValue);
  };

  const displayValue = value ? `$${value}` : '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={fieldLabelClassName}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full text-base text-white placeholder:text-white/40 sm:text-sm touch-manipulation
            ${fieldBoxClassName}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/15'}
            ${
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-white/25'
            }
          `}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
