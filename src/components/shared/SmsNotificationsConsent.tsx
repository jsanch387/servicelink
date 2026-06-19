'use client';

import { ROUTES, type PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import Link from 'next/link';
import React, { useId } from 'react';
import { nativeCheckboxSmClassName } from './nativeCheckboxClasses';

interface SmsNotificationsConsentProps {
  businessName: string;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  error?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  className?: string;
}

export function SmsNotificationsConsent({
  businessName,
  agreed,
  onAgreedChange,
  error = null,
  bookingFlowLocale = 'en',
  className = '',
}: SmsNotificationsConsentProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const errorId = useId();

  return (
    <div className={`space-y-1.5 pt-1 ${className}`.trim()}>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => onAgreedChange(e.target.checked)}
          className={`mt-0.5 cursor-pointer ${nativeCheckboxSmClassName}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <span className="text-xs leading-snug text-gray-300">
          {ui.calendar.notificationsConsentLabel(businessName)}{' '}
          <Link
            href={ROUTES.PRIVACY}
            className="text-gray-400 underline underline-offset-2 hover:text-gray-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            {ui.calendar.notificationsSmsFinePrintLinkLabel}
          </Link>
        </span>
      </label>
      {error ? (
        <p id={errorId} className="text-xs text-red-400/95 pl-6" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
