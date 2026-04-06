import React, { forwardRef, type ReactNode } from 'react';

export interface TextAreaProps {
  label?: string;
  /** Rendered below the textarea, bottom-left (e.g. format actions). */
  footerStart?: ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  name?: string;
  rows?: number;
  maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      footerStart,
      placeholder,
      value,
      onChange,
      required = false,
      error,
      disabled = false,
      className = '',
      inputClassName = '',
      name,
      rows = 4,
      maxLength,
    },
    ref
  ) {
    const showFooterRow = footerStart != null || maxLength != null;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-left text-sm font-medium text-gray-200 mb-1.5">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          name={name}
          rows={rows}
          maxLength={maxLength}
          className={`
          w-full px-4 py-3.5 sm:px-5 sm:py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8
          transition-all duration-200 resize-none touch-manipulation
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 active:bg-white/8'}
          ${inputClassName}
        `}
        />
        {showFooterRow && (
          <div
            className={`mt-1.5 min-h-[2.25rem] flex items-center ${
              footerStart != null && maxLength != null
                ? 'justify-between gap-3'
                : footerStart != null
                  ? 'justify-start'
                  : 'justify-end'
            }`}
          >
            {footerStart != null ? (
              <div className="flex items-center min-w-0 -ml-1">{footerStart}</div>
            ) : null}
            {maxLength != null ? (
              <p className="text-xs text-gray-400 shrink-0 tabular-nums">
                {value.length}/{maxLength}
              </p>
            ) : null}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
