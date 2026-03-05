import React from 'react';

interface PriceInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  // eslint-disable-next-line no-unused-vars
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
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
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
            w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-normal
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
            transition-all duration-200 touch-manipulation
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
            ${disabled ? 'opacity-60 cursor-not-allowed bg-white/3' : 'hover:border-white/20 active:bg-white/8'}
          `}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
