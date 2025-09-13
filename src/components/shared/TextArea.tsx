import React from 'react';

interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  rows?: number;
  maxLength?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = '',
  name,
  rows = 4,
  maxLength,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 bg-neutral-800 border rounded-md text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          transition-colors duration-200 resize-none
          ${error ? 'border-red-500' : 'border-neutral-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-500'}
        `}
      />
      {maxLength && (
        <div className="flex justify-between items-center mt-1">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-gray-400 ml-auto">
            {value.length}/{maxLength}
          </p>
        </div>
      )}
      {error && !maxLength && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
