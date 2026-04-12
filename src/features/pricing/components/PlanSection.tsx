'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CrownIcon } from '@/icons';
import React, { useState } from 'react';
import type { PlanId } from '../types';
import { PLANS } from '../types';

interface PlanSectionProps {
  /** Current plan to display. Defaults to 'free' when no subscription data exists. */
  planId?: PlanId;
}

export const PlanSection: React.FC<PlanSectionProps> = ({
  planId = 'free',
}) => {
  const plan = PLANS[planId];
  const isPro = planId === 'pro';
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
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
  };

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="w-full min-w-0 p-4 text-left"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Subscription plan
        </h2>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mt-4">
        <div className="flex min-h-[2.5rem] flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="inline-flex items-center gap-1.5 font-semibold leading-none text-white">
            {isPro ? (
              <>
                <span>{plan.name}</span>
                <CrownIcon className="h-5 w-5 shrink-0 translate-y-[3px] text-amber-300" />
              </>
            ) : (
              plan.name
            )}
          </p>
          <p className="inline-flex items-center gap-1 text-lg font-bold leading-none text-white tabular-nums">
            {plan.price}
            <span className="text-sm font-normal leading-none text-gray-400">
              /month
            </span>
          </p>
        </div>
      </div>

      {isPro ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            loading={portalLoading}
          >
            Manage subscription
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button
            href={ROUTES.DASHBOARD.UPGRADE}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            View plans & upgrade
          </Button>
        </div>
      )}
    </GlassCard>
  );
};
