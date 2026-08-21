'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { usPhoneSmsHref, usPhoneTelHref } from '@/lib/formatUsPhone';
import {
  ChatBubbleOvalLeftIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface BookingLinkV2ContactActionsProps {
  phoneNumber: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export function BookingLinkV2ContactActions({
  phoneNumber,
  bookingFlowLocale = 'en',
}: BookingLinkV2ContactActionsProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const callHref = usPhoneTelHref(phoneNumber);
  const textHref = usPhoneSmsHref(phoneNumber);
  if (!callHref || !textHref) return null;

  const buttonClassName =
    'inline-flex min-h-[42px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-white/[0.06] px-4 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]';

  return (
    <div className="mt-5 flex w-full max-w-sm items-center justify-center gap-2">
      <a
        href={callHref}
        className={buttonClassName}
        aria-label={ui.profile.contactCallAriaLabel}
      >
        <PhoneIcon className="h-4 w-4" aria-hidden />
        {ui.profile.contactCallCta}
      </a>
      <a
        href={textHref}
        className={buttonClassName}
        aria-label={ui.profile.contactTextAriaLabel}
      >
        <ChatBubbleOvalLeftIcon className="h-4 w-4" aria-hidden />
        {ui.profile.contactTextCta}
      </a>
    </div>
  );
}
