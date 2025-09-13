import React from 'react';

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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
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
            w-full px-4 py-3 bg-neutral-800 border rounded-md text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-500' : 'border-neutral-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-500'}
          `}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
