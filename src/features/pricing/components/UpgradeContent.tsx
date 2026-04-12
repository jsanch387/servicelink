'use client';

import { Button } from '@/components/shared';
import React, { useState } from 'react';
import {
  MARKETING_FREE_PLAN_FEATURES,
  MARKETING_PRO_PLAN_FEATURES,
} from '../marketingPlanFeatures';
import { PLANS } from '../types';
import { PricingPlanCard } from './PricingPlanCard';

export interface UpgradeContentProps {
  /** When true, user already has active Pro — show manage billing instead of checkout. */
  isProSubscriber?: boolean;
}

export const UpgradeContent: React.FC<UpgradeContentProps> = ({
  isProSubscriber = false,
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgradeToPro = async () => {
    setError(null);
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setError(null);
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
      setError(data.error ?? 'Could not open billing portal');
    } catch {
      setError('Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-5xl mx-auto w-full min-w-0">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isProSubscriber ? 'Your plan' : 'Upgrade your plan'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            {isProSubscriber
              ? 'You are on Pro. Manage billing below or review how Free compares.'
              : 'Compare Free and Pro, then upgrade to Pro when you are ready.'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <PricingPlanCard
            variant="free"
            title={free.name}
            description={free.description}
            price={free.price}
            features={MARKETING_FREE_PLAN_FEATURES}
            emphasizeFeatureHighlights={false}
            footer={
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled
              >
                {isProSubscriber ? 'Included with Pro' : 'Current plan'}
              </Button>
            }
          />
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={MARKETING_PRO_PLAN_FEATURES}
            badgeLabel="Most popular"
            footer={
              <div className="space-y-4">
                {error ? (
                  <p className="text-rose-400 text-sm" role="alert">
                    {error}
                  </p>
                ) : null}
                {isProSubscriber ? (
                  <Button
                    type="button"
                    variant="inverse"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    loading={portalLoading}
                  >
                    Manage subscription
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="inverse"
                    className="w-full"
                    onClick={handleUpgradeToPro}
                    disabled={checkoutLoading}
                    loading={checkoutLoading}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>
    </main>
  );
};
