'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import { nativeCheckboxSmClassName } from '@/components/shared/nativeCheckboxClasses';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useId, useState } from 'react';
import { BookingPolicyAgreeModal } from './BookingPolicyAgreeModal';

export function BookingPolicyConsent({
  policyText,
  agreed,
  onAgreedChange,
  error = null,
  bookingFlowLocale = 'en',
}: {
  policyText: string;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  error?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const errorId = useId();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        {agreed ? (
          <span
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15"
            aria-hidden
          >
            <CheckIcon className="h-2.5 w-2.5 text-emerald-400" />
          </span>
        ) : (
          <input
            type="checkbox"
            checked={false}
            onChange={event => onAgreedChange(event.target.checked)}
            className={`mt-0.5 cursor-pointer ${nativeCheckboxSmClassName}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        )}
        <p className="text-sm leading-snug text-zinc-500">
          {ui.calendar.policyReviewLead}{' '}
          <button
            type="button"
            className="cursor-pointer text-zinc-300 underline decoration-white/25 underline-offset-2 hover:text-white hover:decoration-white/50"
            onClick={() => setPolicyOpen(true)}
          >
            {ui.calendar.policyLinkLabel}
          </button>
        </p>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-400/95" role="alert">
          {error}
        </p>
      ) : null}
      <BookingPolicyAgreeModal
        isOpen={policyOpen}
        policyText={policyText}
        viewOnly={agreed}
        onClose={() => setPolicyOpen(false)}
        onAgreed={() => {
          onAgreedChange(true);
          setPolicyOpen(false);
        }}
        bookingFlowLocale={bookingFlowLocale}
      />
    </div>
  );
}
