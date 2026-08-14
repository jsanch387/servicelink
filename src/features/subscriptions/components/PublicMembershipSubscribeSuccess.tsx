'use client';

import { Button } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { SubscriptionSuccessCheckmark } from './SubscriptionSuccessCheckmark';
import './SubscriptionPlanReadySuccess.css';

interface PublicMembershipSubscribeSuccessProps {
  plan: CustomerSubscriptionPlan | null;
  /** Cadence they checked out — card shows only this option when set. */
  priceId?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  businessName?: string | null;
  onDone: () => void;
}

/** Narrow the plan card to the cadence the customer paid for. */
function planForPurchasedCadence(
  plan: CustomerSubscriptionPlan,
  priceId: string | null | undefined
): CustomerSubscriptionPlan {
  const id = priceId?.trim() ?? '';
  if (!id) return plan;
  const option = plan.cadenceOptions.find(o => o.id === id);
  if (!option) return plan;
  return {
    ...plan,
    cadenceOptions: [{ ...option, isDefault: true }],
  };
}

/**
 * Full-panel success after Stripe membership Checkout returns to the booking link.
 * Visual twin of owner `SubscriptionPlanReadySuccess`.
 */
export const PublicMembershipSubscribeSuccess: React.FC<
  PublicMembershipSubscribeSuccessProps
> = ({ plan, priceId, bookingFlowLocale = 'en', businessName, onDone }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const previewPlan = plan ? planForPurchasedCadence(plan, priceId) : null;
  const name = businessName?.trim() || null;
  const subtitle = name
    ? ui.subscriptions.successSubtitleWithBusiness(name)
    : ui.subscriptions.successSubtitle;

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#0f0f0f] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-2 py-8 pb-20 text-center sm:-mt-10 sm:pb-28 lg:-mt-14">
        <div className="mb-3">
          <SubscriptionSuccessCheckmark />
        </div>

        <div className="subscription-plan-ready-content">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {ui.subscriptions.successTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]">
            {subtitle}
          </p>
        </div>

        {previewPlan ? (
          <div className="subscription-plan-ready-card mt-8 w-full text-left">
            <SubscriptionPlanCard
              plan={previewPlan}
              bookingFlowLocale={bookingFlowLocale}
              preview
            />
          </div>
        ) : null}

        <div className="subscription-plan-ready-card mt-8 w-full">
          <Button
            type="button"
            variant="inverse"
            size="md"
            fullWidth
            onClick={onDone}
          >
            {ui.subscriptions.successDoneCta}
          </Button>
        </div>
      </div>
    </main>
  );
};
