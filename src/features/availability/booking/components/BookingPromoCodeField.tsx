'use client';

import React, { useId, useState } from 'react';

export type AppliedBookingPromo = {
  code: string;
  label: string;
  discountCents: number;
  subtotalCents: number;
  estimatedTotalCents: number;
};

type BookingPromoCodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  applied: AppliedBookingPromo | null;
  onApply: () => Promise<void>;
  onRemove: () => void;
  error: string | null;
  isApplying?: boolean;
  disabled?: boolean;
  labels: {
    heading: string;
    placeholder: string;
    apply: string;
    applying: string;
    remove: string;
    applied: (code: string) => string;
  };
};

export function BookingPromoCodeField({
  value,
  onChange,
  applied,
  onApply,
  onRemove,
  error,
  isApplying = false,
  disabled = false,
  labels,
}: BookingPromoCodeFieldProps) {
  const inputId = useId();
  const [localBusy, setLocalBusy] = useState(false);
  const busy = isApplying || localBusy;

  const handleApply = async () => {
    if (busy || disabled || !value.trim()) return;
    setLocalBusy(true);
    try {
      await onApply();
    } finally {
      setLocalBusy(false);
    }
  };

  if (applied) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-200">
              {labels.applied(applied.code)}
            </p>
            <p className="mt-0.5 text-xs text-emerald-200/70 truncate">
              {applied.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="shrink-0 cursor-pointer text-sm text-emerald-200/80 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {labels.remove}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-200"
      >
        {labels.heading}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={value}
          disabled={disabled || busy}
          onChange={e => onChange(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleApply();
            }
          }}
          placeholder={labels.placeholder}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-white/25 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={disabled || busy || !value.trim()}
          className="shrink-0 cursor-pointer rounded-lg border border-white/15 bg-white/[0.08] px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? labels.applying : labels.apply}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
