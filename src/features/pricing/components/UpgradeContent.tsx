'use client';

import { Button } from '@/components/shared';
import React, { useState } from 'react';
import { PUBLIC_PRICING_PRO_PLAN_FEATURES } from '../marketingPlanFeatures';
import { PLANS } from '../types';
import { PricingPlanCard } from './PricingPlanCard';

export interface UpgradeContentProps {
  /** When true, user already has active Pro — show manage billing instead of checkout. */
  isProSubscriber?: boolean;
  /** When true, user is locked out after trial/subscription and must reactivate. */
  isBillingLocked?: boolean;
}

export const UpgradeContent: React.FC<UpgradeContentProps> = ({
  isProSubscriber = false,
  isBillingLocked = false,
}) => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.success || !data.url) {
        const message = data.error ?? 'Something went wrong';
        console.error('[Upgrade] create-checkout-session failed', {
          status: res.status,
          message,
        });
        setError(message);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('[Upgrade] create-checkout-session request error', err);
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
        <div className="mb-8 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isProSubscriber
              ? 'Your plan'
              : isBillingLocked
                ? 'Your trial has ended'
                : 'Upgrade your plan'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            {isProSubscriber
              ? 'You are on Pro. Manage your billing below.'
              : isBillingLocked
                ? 'Your ServiceLink page is no longer live. Upgrade to Pro to restore access and continue getting bookings.'
                : 'Choose Pro to unlock payments, unlimited bookings, and full business tools.'}
          </p>
        </div>

        <div className="max-w-xl">
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
            badgeLabel={isBillingLocked ? 'Reactivate access' : 'Pro plan'}
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
                    {isBillingLocked
                      ? 'Reactivate Pro and go live'
                      : 'Upgrade to Pro'}
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
