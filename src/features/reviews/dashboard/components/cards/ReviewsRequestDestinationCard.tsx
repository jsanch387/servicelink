'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';
import {
  GOOGLE_CONNECT_DESTINATION_GOOGLE,
  GOOGLE_CONNECT_DESTINATION_GOOGLE_DISABLED_HINT,
  GOOGLE_CONNECT_DESTINATION_GOOGLE_HINT,
  GOOGLE_CONNECT_DESTINATION_SERVICELINK,
  GOOGLE_CONNECT_DESTINATION_SERVICELINK_HINT,
  type ReviewRequestDestination,
} from '../../copy/googleConnectCopy';

type ReviewsRequestDestinationCardProps = {
  googleConnected?: boolean;
  value: ReviewRequestDestination;
  loading?: boolean;
  disabled?: boolean;
  onChange: (destination: ReviewRequestDestination) => void;
};

const OPTIONS = [
  {
    id: 'servicelink' as const,
    label: GOOGLE_CONNECT_DESTINATION_SERVICELINK,
    hint: GOOGLE_CONNECT_DESTINATION_SERVICELINK_HINT,
  },
  {
    id: 'google' as const,
    label: GOOGLE_CONNECT_DESTINATION_GOOGLE,
    hint: GOOGLE_CONNECT_DESTINATION_GOOGLE_HINT,
  },
] as const;

export const ReviewsRequestDestinationCard: React.FC<
  ReviewsRequestDestinationCardProps
> = ({
  googleConnected = false,
  value,
  loading = false,
  disabled = false,
  onChange,
}) => {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        aria-hidden
      >
        {[0, 1].map(key => (
          <div
            key={key}
            className="h-[6.5rem] animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {OPTIONS.map(option => {
        const active = value === option.id;
        const optionDisabled =
          disabled || (option.id === 'google' && !googleConnected);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={optionDisabled}
            title={
              option.id === 'google' && !googleConnected
                ? GOOGLE_CONNECT_DESTINATION_GOOGLE_DISABLED_HINT
                : undefined
            }
            onClick={() => onChange(option.id)}
            className={`rounded-2xl border p-4 text-left transition-colors sm:p-5 ${
              optionDisabled
                ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-50'
                : active
                  ? 'cursor-pointer border-white/[0.08] bg-white/[0.06]'
                  : 'cursor-pointer border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{option.label}</p>
                <p className="mt-1 text-sm leading-snug text-zinc-400">
                  {option.hint}
                </p>
              </div>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  active
                    ? 'bg-white text-black'
                    : 'border border-white/25 bg-transparent'
                }`}
                aria-hidden
              >
                {active ? (
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : null}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
