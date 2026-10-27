'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { fieldBoxClassName, fieldLabelClassName } from './fieldStyles';

interface InputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
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
  /** Quiet mark on the right, such as %. */
  suffix?: React.ReactNode;
  /** Max length for the input value (native maxLength). */
  maxLength?: number;
  'aria-label'?: string;
  onBlur?: () => void;
  /** Soft helper under the field (hidden when `error` is set). */
  hint?: React.ReactNode;
  /** Kept so existing callers compile. Every input uses the standard field. */
  size?: 'default' | 'compact';
}

export const Input: React.FC<InputProps> = ({
  id,
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
  suffix,
  maxLength,
  'aria-label': ariaLabel,
  onBlur,
  hint,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType
    ? showPassword
      ? 'text'
      : 'password'
    : type;
  const hasLeftIcon = Boolean(leftIcon);
  const hasSuffix = Boolean(suffix);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className={fieldLabelClassName}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {hasLeftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          name={name}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-label={ariaLabel}
          className={`
            w-full text-base text-white placeholder:text-white/40 sm:text-sm touch-manipulation
            ${fieldBoxClassName}
            ${hasLeftIcon ? '!pl-9' : ''}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/15'}
            ${
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-white/25'
            }
            ${isPasswordType || hasSuffix ? '!pr-8' : ''}
            ${inputClassName}
          `}
        />
        {hasSuffix && !isPasswordType ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm tabular-nums text-white/40">
            {suffix}
          </span>
        ) : null}
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-white/40 hover:text-white"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-white/60">{hint}</p>
      ) : null}
    </div>
  );
};
