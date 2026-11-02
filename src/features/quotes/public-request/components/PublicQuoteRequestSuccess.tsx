'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { SubscriptionSuccessCheckmark } from '@/features/subscriptions/components/SubscriptionSuccessCheckmark';
import '@/features/subscriptions/components/SubscriptionPlanReadySuccess.css';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import Link from 'next/link';
import React, { useMemo } from 'react';
import type { PublicQuoteRequestFormData } from '../types';
import { PublicQuoteRequestSummaryCard } from './PublicQuoteRequestSummaryCard';

interface PublicQuoteRequestSuccessProps {
  businessName: string;
  businessSlug: string;
  form: PublicQuoteRequestFormData;
  showVehicleFields: boolean;
  showSecondVehicle?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

/**
 * Confirmation after a public quote request — same check animation as
 * booking / membership / payment success.
 */
export const PublicQuoteRequestSuccess: React.FC<
  PublicQuoteRequestSuccessProps
> = ({
  businessName,
  businessSlug,
  form,
  showVehicleFields,
  showSecondVehicle = false,
  bookingFlowLocale = 'en',
}) => {
  const qf = useMemo(
    () => publicBookingUi(bookingFlowLocale).quoteForm,
    [bookingFlowLocale]
  );

  return (
    <div className="flex w-full flex-col py-10 pb-16">
      <div className="mb-3 flex justify-center">
        <SubscriptionSuccessCheckmark />
      </div>

      <div className="subscription-plan-ready-content mb-8 text-center">
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {qf.successTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
          {qf.successSubtitle(businessName)}
        </p>
      </div>

      <PublicQuoteRequestSummaryCard
        form={form}
        showVehicleFields={showVehicleFields}
        showSecondVehicle={showSecondVehicle}
        bookingFlowLocale={bookingFlowLocale}
        header={qf.successCardHeader}
        blurColor="bg-emerald-500"
        className="subscription-plan-ready-card mb-8 w-full"
      />

      <Link
        href={`/${businessSlug}`}
        className="inline-flex min-h-[48px] cursor-pointer items-center justify-center self-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
      >
        {qf.successBack}
      </Link>
    </div>
  );
};
