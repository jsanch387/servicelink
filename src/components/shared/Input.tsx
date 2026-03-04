'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password';
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  name?: string;
  autoComplete?: string;
  /** Hint for virtual keyboard (e.g. "tel", "email", "numeric"). */
  inputMode?:
    | 'text'
    | 'tel'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'search'
    | 'url';
  /** Optional icon on the left (e.g. phone); adds left padding when set. */
  leftIcon?: React.ReactNode;
  /** Max length for the input value (native maxLength). */
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  disabled = false,
  className = '',
  inputClassName = '',
  name,
  autoComplete,
  inputMode,
  leftIcon,
  maxLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType
    ? showPassword
      ? 'text'
      : 'password'
    : type;
  const hasLeftIcon = Boolean(leftIcon);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-left text-sm font-medium text-gray-200 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          name={name}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`
            w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-normal
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
            transition-all duration-200 touch-manipulation
            ${hasLeftIcon ? 'pl-9' : ''}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
            ${disabled ? 'opacity-60 cursor-not-allowed bg-white/3' : 'hover:border-white/20 active:bg-white/8'}
            ${isPasswordType ? 'pr-10' : ''}
            ${inputClassName}
          `}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
