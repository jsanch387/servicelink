'use client';

import { Button } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useState } from 'react';
import {
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
} from '../marketingPlanFeatures';
import type { BillingInterval } from '../types';
import { PLANS } from '../types';
import { getProBillingDisplay } from '../utils/proBillingDisplay';
import { BillingIntervalToggle } from './BillingIntervalToggle';
import { PricingPlanCard } from './PricingPlanCard';

export interface UpgradeContentProps {
  /** When true, user already has active Pro — show manage billing instead of checkout. */
  isProSubscriber?: boolean;
  /** When true, user is locked out after subscription lapsed and must reactivate. */
  isBillingLocked?: boolean;
  /** Grandfathered or Stripe-reported rate for current Pro subscribers. */
  subscriberPlanPrice?: string | null;
  /** Billing cadence for current Pro subscribers (from Stripe). */
  subscriberBillingInterval?: BillingInterval | null;
}

export const UpgradeContent: React.FC<UpgradeContentProps> = ({
  isProSubscriber = false,
  isBillingLocked = false,
  subscriberPlanPrice = null,
  subscriberBillingInterval = null,
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutBilling = getProBillingDisplay(billingInterval);
  const subscriberInterval = subscriberBillingInterval ?? 'month';
  const proDisplay = isProSubscriber
    ? {
        price:
          subscriberPlanPrice?.trim() || getProBillingDisplay('month').price,
        priceSuffix: subscriberInterval === 'year' ? '/ year' : '/ month',
        subline: null,
      }
    : {
        price: checkoutBilling.price,
        priceSuffix: checkoutBilling.priceSuffix,
        subline: checkoutBilling.subline,
      };

  const handleUpgradeToPro = async () => {
    setError(null);
    setCheckoutLoading(true);
    try {
      const res = await fetch(API_ROUTES.STRIPE_CREATE_CHECKOUT_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInterval }),
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

  const proCtaLabel = isBillingLocked ? 'Reactivate Pro' : 'Get Pro';

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col">
        <header className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {isProSubscriber ? 'Your plan' : 'Upgrade'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed max-w-2xl">
            {isProSubscriber
              ? 'You are on Pro. Manage billing below or review what is included on Free.'
              : isBillingLocked
                ? 'Reactivate Pro to restore unlimited bookings and Pro features.'
                : 'Upgrade to Pro to unlock unlimited bookings, payments, quotes, and more.'}
          </p>
        </header>

        {error ? (
          <p
            className="mb-6 text-rose-400 text-sm text-center sm:text-left"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!isProSubscriber ? (
          <div className="mb-8 flex justify-center sm:mb-10">
            <BillingIntervalToggle
              value={billingInterval}
              onChange={setBillingInterval}
            />
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <PricingPlanCard
            variant="free"
            title={free.name}
            description={free.description}
            price={free.price}
            priceSuffix=" forever"
            features={PUBLIC_PRICING_FREE_PLAN_FEATURES}
            emphasizeFeatureHighlights
            badgeLabel={isProSubscriber ? undefined : 'Current plan'}
            footer={
              isProSubscriber ? (
                <p className="text-center text-sm text-zinc-500">
                  Features on your previous Free plan
                </p>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled
                >
                  Current plan
                </Button>
              )
            }
          />

          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={proDisplay.price}
            priceSuffix={proDisplay.priceSuffix}
            priceSubline={proDisplay.subline}
            features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
            badgeLabel={isProSubscriber ? 'Current plan' : 'Most popular'}
            footer={
              isProSubscriber ? (
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
                  {proCtaLabel}
                </Button>
              )
            }
          />
        </div>
      </div>
    </main>
  );
};
