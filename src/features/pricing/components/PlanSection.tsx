'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';
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
        {isPro && (
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white">
            Pro
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 mt-1 mb-4">
        Your current plan and what’s included.
      </p>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-white">{plan.name}</p>
          <p className="text-lg font-bold text-white tabular-nums">
            {plan.price}
            <span className="text-sm font-normal text-gray-400">/month</span>
          </p>
        </div>
      </div>

      {!isPro && (
        <div className="mt-4">
          <Button
            href={ROUTES.DASHBOARD.UPGRADE}
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
          >
            View plans & upgrade
          </Button>
        </div>
      )}
    </GlassCard>
  );
};
