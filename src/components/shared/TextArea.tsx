import { forwardRef, type ReactNode } from 'react';
import { fieldLabelClassName, fieldSurfaceClassName } from './fieldStyles';

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
  'aria-label'?: string;
  rows?: number;
  maxLength?: number;
  /** When true, `maxLength` is enforced but the x/y counter is hidden. */
  hideCharCount?: boolean;
  /**
   * Kept so existing callers compile. Text areas use the same field chrome as `Input`.
   */
  size?: 'default' | 'compact';
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
      'aria-label': ariaLabel,
      rows = 4,
      maxLength,
      hideCharCount = false,
    },
    ref
  ) {
    const showCharCounter = maxLength != null && !hideCharCount;
    const showFooterRow = footerStart != null || showCharCounter;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className={fieldLabelClassName}>
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
          aria-label={ariaLabel}
          rows={rows}
          maxLength={maxLength}
          className={`
          w-full px-3 py-2 text-base text-white placeholder:text-white/40 sm:text-sm
          touch-manipulation scrollbar-dark resize-y
          ${fieldSurfaceClassName}
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/15'}
          ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-white/25'
          }
          ${inputClassName}
        `}
        />
        {showFooterRow && (
          <div
            className={`mt-0.5 flex items-center ${
              footerStart != null && showCharCounter
                ? 'justify-between gap-3'
                : footerStart != null
                  ? 'justify-start'
                  : 'justify-end'
            }`}
          >
            {footerStart != null ? (
              <div className="flex items-center min-w-0 -ml-1 -mt-0.5">
                {footerStart}
              </div>
            ) : null}
            {showCharCounter ? (
              <p className="pt-0.5 text-xs text-gray-400 shrink-0 tabular-nums">
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
