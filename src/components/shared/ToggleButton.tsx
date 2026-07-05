import React from 'react';

interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleButtonProps {
  options: ToggleOption[];
  value: string;

  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
  };

  return (
    <div className={`inline-flex bg-neutral-700 rounded-lg p-1 ${className}`}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none cursor-pointer
            ${sizeClasses[size]}
            ${
              value === option.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-neutral-600'
            }
          `}
          type="button"
        >
          {option.icon && (
            <span
              className={`${option.label ? 'mr-2' : ''} ${iconSizeClasses[size]}`}
            >
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
};
