'use client';

import { nativeCheckboxSmClassName } from '@/components/shared/nativeCheckboxClasses';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import React, { useId } from 'react';

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

  return (
    <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-medium text-white">
        {ui.calendar.policyHeading}
      </p>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5 sm:max-h-56">
        <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-zinc-300 sm:text-sm sm:leading-relaxed">
          {policyText}
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={agreed}
          onChange={event => onAgreedChange(event.target.checked)}
          className={`mt-0.5 cursor-pointer ${nativeCheckboxSmClassName}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <span className="text-sm text-gray-200">
          {ui.calendar.policyConsentCheckboxLabel}
        </span>
      </label>
      {error ? (
        <p id={errorId} className="text-xs text-red-400/95" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
