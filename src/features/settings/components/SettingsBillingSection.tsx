'use client';

import { Button } from '@/components/shared';
import { PlanSection } from '@/features/pricing';
import type { PlanId } from '@/features/pricing';
import type { BillingInterval } from '@/features/pricing/types';
import React, { useCallback, useState } from 'react';

export interface SettingsBillingSectionProps {
  planId: PlanId;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionMonthlyPrice?: string | null;
  subscriptionBillingInterval?: BillingInterval | null;
}

export const SettingsBillingSection: React.FC<SettingsBillingSectionProps> = ({
  planId,
  subscriptionStatus = null,
  subscriptionCurrentPeriodEnd = null,
  subscriptionCancelAtPeriodEnd = false,
  subscriptionMonthlyPrice = null,
  subscriptionBillingInterval = null,
}) => {
  const [portalLoading, setPortalLoading] = useState(false);
  const showPaymentFailedBanner =
    subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid';

  const handleOpenPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalLoading(false);
    } catch {
      setPortalLoading(false);
    }
  }, []);

  return (
    <section className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Subscription
        </h2>
        {planId === 'pro' && subscriptionCancelAtPeriodEnd ? (
          <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-600/40 bg-zinc-800/40 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
            Canceled
          </span>
        ) : null}
      </div>

      {showPaymentFailedBanner ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-amber-200 text-sm font-medium mb-3">
            We couldn&apos;t charge your card. Please update your payment method
            to restore Pro access.
          </p>
          <Button
            type="button"
            variant="inverse"
            onClick={handleOpenPortal}
            loading={portalLoading}
            disabled={portalLoading}
            className="w-full sm:w-auto"
          >
            Update payment method
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
        hideHeading
      />
    </section>
  );
};
