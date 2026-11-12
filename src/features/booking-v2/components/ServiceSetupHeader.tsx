'use client';

import { getPublicBusinessProfilePath } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

const STEP_COUNT = 4;

export function ServiceSetupHeader({
  businessSlug,
  bookingFlowLocale,
  backHref,
  backLabel,
  step = 1,
  stepTitle,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  backHref?: string;
  backLabel?: string;
  /** 1-based step. Fills that many progress segments. */
  step?: number;
  stepTitle?: string;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const href =
    backHref ??
    getPublicBusinessProfilePath(businessSlug, {
      lang: bookingFlowLocale,
    });

  return (
    <header className="pt-2">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <Link
          href={href}
          aria-label={backLabel ?? ui.backToProfile}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center text-white"
        >
          <ChevronLeftIcon className="h-[22px] w-[22px]" aria-hidden />
        </Link>
        <p className="text-center text-[14px] leading-5">
          <span className="font-semibold text-white">
            {stepTitle ?? ui.servicesStep}
          </span>
          <span className="font-medium text-[#A3A3A3]">
            {' '}
            · {ui.stepOf(step, STEP_COUNT)}
          </span>
        </p>
        <span aria-hidden />
      </div>
      <div className="mt-2 flex gap-1 px-5" aria-hidden>
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <span
            key={index}
            className={`h-[3px] flex-1 rounded-[2px] ${
              index < step ? 'bg-white' : 'bg-[#2A2A2A]'
            }`}
          />
        ))}
      </div>
    </header>
  );
}
