'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CrownIcon } from '@/icons';
import React, { useState } from 'react';
import type { PlanId } from '../types';
import { PLANS } from '../types';

function formatRenewalDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface PlanSectionProps {
  /** Current plan to display. Defaults to 'free' when no subscription data exists. */
  planId?: PlanId;
  /** From `profiles.subscription_current_period_end` (paying subscribers). */
  subscriptionCurrentPeriodEnd?: string | null;
  /** From `profiles.subscription_cancel_at_period_end` (Stripe cancel at period end). */
  subscriptionCancelAtPeriodEnd?: boolean;
  /** From `profiles.subscription_status` (e.g. trialing, active). */
  subscriptionStatus?: string | null;
  /** When set, overrides `PLANS.pro.price` (e.g. grandfathered $10/mo from Stripe). */
  monthlyPriceOverride?: string | null;
  /** Hide the section heading when a parent group label is shown (e.g. Settings billing). */
  hideHeading?: boolean;
}

export const PlanSection: React.FC<PlanSectionProps> = ({
  planId = 'free',
  subscriptionCurrentPeriodEnd = null,
  subscriptionCancelAtPeriodEnd = false,
  subscriptionStatus = null,
  monthlyPriceOverride = null,
  hideHeading = false,
}) => {
  const plan = PLANS[planId];
  const isPro = planId === 'pro';
  const displayPrice =
    isPro && monthlyPriceOverride?.trim()
      ? monthlyPriceOverride.trim()
      : plan.price;
  const renewalDateLabel = formatRenewalDate(subscriptionCurrentPeriodEnd);
  const isTrialing = subscriptionStatus === 'trialing';
  const displayPlanName = isPro && isTrialing ? 'Pro trial' : plan.name;
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
    <section className="w-full min-w-0">
      {hideHeading ? (
        isPro && subscriptionCancelAtPeriodEnd ? (
          <div className="mb-3 flex justify-end">
            <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-600/40 bg-zinc-800/40 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              Canceled
            </span>
          </div>
        ) : null
      ) : (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Subscription plan
          </h2>
          {isPro && subscriptionCancelAtPeriodEnd ? (
            <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-600/40 bg-zinc-800/40 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              Canceled
            </span>
          ) : null}
        </div>
      )}

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur={true}
        className="w-full min-w-0 p-4 text-left"
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex min-h-[2.5rem] flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="inline-flex items-center gap-1.5 font-semibold leading-none text-white">
              {isPro ? (
                <>
                  <span>{displayPlanName}</span>
                  <CrownIcon className="h-5 w-5 shrink-0 translate-y-[3px] text-amber-300" />
                </>
              ) : (
                plan.name
              )}
            </p>
            {isPro && isTrialing ? (
              <p className="inline-flex items-center gap-1 text-lg font-bold leading-none text-emerald-300">
                Free trial
              </p>
            ) : (
              <p className="inline-flex items-center gap-1 text-lg font-bold leading-none text-white tabular-nums">
                {displayPrice}
                <span className="text-sm font-normal leading-none text-gray-400">
                  /month
                </span>
              </p>
            )}
          </div>
        </div>

        {isPro && renewalDateLabel ? (
          <p className="mt-2 text-left text-xs text-zinc-500 leading-relaxed">
            {isTrialing ? (
              <>
                Trial ends on{' '}
                <span className="text-zinc-400 tabular-nums">
                  {renewalDateLabel}
                </span>
              </>
            ) : subscriptionCancelAtPeriodEnd ? (
              <>
                Pro access until{' '}
                <span className="text-zinc-400 tabular-nums">
                  {renewalDateLabel}
                </span>
              </>
            ) : (
              <>Renews on {renewalDateLabel}</>
            )}
          </p>
        ) : null}

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
    </section>
  );
};
