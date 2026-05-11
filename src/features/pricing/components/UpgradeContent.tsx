'use client';

import { Button } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
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
      const res = await fetch(API_ROUTES.STRIPE_CREATE_CHECKOUT_SESSION, {
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
      const res = await fetch(API_ROUTES.STRIPE_CREATE_PORTAL_SESSION, {
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
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-center text-center">
        <header className="mb-8 sm:mb-10 w-full max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {isProSubscriber
              ? "You're on Pro"
              : isBillingLocked
                ? 'Choose Pro'
                : 'Pro'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
            {isProSubscriber
              ? 'Update billing or cancel anytime below.'
              : isBillingLocked
                ? "Tap below when you're ready to jump back in."
                : 'One plan for your whole workflow.'}
          </p>
        </header>

        <div className="w-full max-w-xl">
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
            footer={
              <div className="space-y-3">
                {error ? (
                  <p className="text-rose-400 text-sm text-center" role="alert">
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
                    {isBillingLocked ? 'Reactivate Pro' : 'Upgrade to Pro'}
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
