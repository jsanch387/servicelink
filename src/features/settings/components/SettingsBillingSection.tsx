'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { PlanSection } from '@/features/pricing';
import type { PlanId } from '@/features/pricing';
import type {
  BillingInterval,
  PlatformBillingAction,
} from '@/features/pricing/types';
import React from 'react';

export interface SettingsBillingSectionProps {
  planId: PlanId;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionMonthlyPrice?: string | null;
  subscriptionBillingInterval?: BillingInterval | null;
  billingAction?: PlatformBillingAction;
}

export const SettingsBillingSection: React.FC<SettingsBillingSectionProps> = ({
  planId,
  subscriptionStatus = null,
  subscriptionCurrentPeriodEnd = null,
  subscriptionCancelAtPeriodEnd = false,
  subscriptionMonthlyPrice = null,
  subscriptionBillingInterval = null,
  billingAction = 'checkout',
}) => {
  const showPaymentFailedBanner = billingAction === 'update_payment';
  const showActiveBillingNote = planId !== 'pro' && billingAction === 'manage';

  return (
    <section className="w-full min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-white">Subscription</h2>
        {planId === 'pro' && subscriptionCancelAtPeriodEnd ? (
          <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-600/40 bg-zinc-800/40 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
            Canceled
          </span>
        ) : null}
      </div>

      {showActiveBillingNote ? (
        <p className="text-sm leading-relaxed text-zinc-400">
          A subscription is already active on this account.
        </p>
      ) : null}

      {showPaymentFailedBanner ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-amber-200 text-sm font-medium mb-3">
            We couldn&apos;t charge your card. Pay the open invoice on this
            subscription.
          </p>
          <Button
            href={ROUTES.DASHBOARD.UPGRADE}
            variant="inverse"
            className="w-full sm:w-auto"
          >
            Pay now
          </Button>
        </div>
      ) : null}

      <PlanSection
        planId={planId}
        subscriptionCurrentPeriodEnd={subscriptionCurrentPeriodEnd}
        subscriptionCancelAtPeriodEnd={subscriptionCancelAtPeriodEnd}
        subscriptionStatus={subscriptionStatus}
        monthlyPriceOverride={subscriptionMonthlyPrice}
        billingInterval={subscriptionBillingInterval ?? undefined}
        billingAction={billingAction}
        hideHeading
      />
    </section>
  );
};
