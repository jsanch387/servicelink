'use client';

import { Button } from '@/components/shared';
import { PlanSection } from '@/features/pricing';
import type { PlanId } from '@/features/pricing';
import React, { useCallback, useState } from 'react';

export interface SettingsBillingSectionProps {
  planId: PlanId;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionMonthlyPrice?: string | null;
}

export const SettingsBillingSection: React.FC<SettingsBillingSectionProps> = ({
  planId,
  subscriptionStatus = null,
  subscriptionCurrentPeriodEnd = null,
  subscriptionCancelAtPeriodEnd = false,
  subscriptionMonthlyPrice = null,
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
      <h2 className="text-lg sm:text-xl font-semibold text-white">
        Subscription
      </h2>

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
        hideHeading
      />
    </section>
  );
};
