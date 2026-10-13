'use client';

import { Button } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { getAffonsoReferralId } from '@/features/marketing-attribution';
import React, { useState } from 'react';
import {
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
  PUBLIC_PRICING_TEAM_PLAN_FEATURES,
} from '../marketingPlanFeatures';
import type { BillingInterval, PlatformBillingAction } from '../types';
import { PLANS } from '../types';
import {
  getProBillingDisplay,
  getTeamBillingDisplay,
} from '../utils/proBillingDisplay';
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
  /**
   * Live Stripe action. Checkout for a new plan, manage when one is already
   * active, update payment when the open subscription needs a card.
   */
  billingAction?: PlatformBillingAction;
  /** Shop already had teammates or invites before Team billing. */
  teamIncluded?: boolean;
  /** Live Team subscription. Includes Pro tools. */
  isTeamSubscriber?: boolean;
}

export const UpgradeContent: React.FC<UpgradeContentProps> = ({
  isProSubscriber = false,
  isBillingLocked = false,
  subscriberPlanPrice = null,
  subscriberBillingInterval = null,
  billingAction = 'checkout',
  teamIncluded = false,
  isTeamSubscriber = false,
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const team = PLANS.team;
  const showProCard = !isTeamSubscriber;
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showManage = isProSubscriber || billingAction === 'manage';
  const showUpdatePayment = !showManage && billingAction === 'update_payment';
  const showCheckout = !showManage && !showUpdatePayment;

  const checkoutBilling = getProBillingDisplay(billingInterval);
  const subscriberInterval = subscriberBillingInterval ?? 'month';
  const proDisplay = showManage
    ? {
        price:
          subscriberPlanPrice?.trim() || getProBillingDisplay('month').price,
        priceSuffix: subscriberInterval === 'year' ? '/ year' : '/ month',
        subline: null,
      }
    : {
        price: checkoutBilling.price,
        priceSuffix: checkoutBilling.priceSuffix,
        subline: showCheckout ? checkoutBilling.subline : null,
      };

  const heading = isProSubscriber
    ? 'Your plan'
    : showManage
      ? 'Subscription'
      : 'Upgrade';
  const subheading = isProSubscriber
    ? 'Manage your plan.'
    : showManage
      ? 'A subscription is already active on this account.'
      : showUpdatePayment
        ? 'Your last payment did not go through. Pay the open invoice on this subscription.'
        : isBillingLocked
          ? 'Reactivate Pro to restore unlimited bookings and Pro features.'
          : 'Upgrade to Pro to unlock unlimited bookings, payments, quotes, and more.';

  const handleCheckout = async (plan: 'pro' | 'team') => {
    setError(null);
    setCheckoutLoading(true);
    const intervalForPlan =
      plan === 'team' && showManage
        ? (subscriberBillingInterval ?? billingInterval)
        : billingInterval;
    try {
      const res = await fetch(API_ROUTES.STRIPE_CREATE_CHECKOUT_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingInterval: intervalForPlan,
          plan,
          affonsoReferral: getAffonsoReferralId(),
        }),
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
  const teamBilling = getTeamBillingDisplay(
    isTeamSubscriber || isProSubscriber ? subscriberInterval : billingInterval
  );
  const teamDisplay = isTeamSubscriber
    ? {
        price:
          subscriberPlanPrice?.trim() || getTeamBillingDisplay('month').price,
        priceSuffix: subscriberInterval === 'year' ? '/ year' : '/ month',
        subline: null as string | null,
      }
    : teamIncluded
      ? { price: 'Included', priceSuffix: '', subline: null as string | null }
      : {
          price: teamBilling.price,
          priceSuffix: teamBilling.priceSuffix,
          subline: showCheckout || isProSubscriber ? teamBilling.subline : null,
        };

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div
        className={`mx-auto flex w-full min-w-0 flex-col ${showProCard ? 'max-w-6xl' : 'max-w-4xl'}`}
      >
        <header className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {heading}
          </h1>
          {subheading ? (
            <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed max-w-2xl">
              {subheading}
            </p>
          ) : null}
        </header>

        {error ? (
          <p
            className="mb-6 text-rose-400 text-sm text-center sm:text-left"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {showCheckout ? (
          <div className="mb-8 flex justify-center sm:mb-10">
            <BillingIntervalToggle
              value={billingInterval}
              onChange={setBillingInterval}
            />
          </div>
        ) : null}

        <div
          className={`grid items-stretch gap-6 ${showProCard ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}
        >
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
              isProSubscriber ? null : (
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

          {showProCard ? (
            <PricingPlanCard
              variant="pro"
              title={pro.name}
              description={pro.description}
              price={proDisplay.price}
              priceSuffix={proDisplay.priceSuffix}
              priceSubline={proDisplay.subline}
              features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
              badgeLabel={
                isProSubscriber
                  ? 'Current plan'
                  : showManage
                    ? 'Active in billing'
                    : showUpdatePayment
                      ? 'Payment needed'
                      : 'Most popular'
              }
              footer={
                isProSubscriber ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    loading={portalLoading}
                  >
                    Cancel plan
                  </Button>
                ) : showManage ? (
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
                ) : showUpdatePayment ? (
                  <div className="flex w-full flex-col gap-2">
                    <Button
                      type="button"
                      variant="inverse"
                      className="w-full"
                      onClick={() => handleCheckout('pro')}
                      disabled={checkoutLoading}
                      loading={checkoutLoading}
                    >
                      Pay now
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      loading={portalLoading}
                    >
                      Manage subscription
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="inverse"
                    className="w-full"
                    onClick={() => handleCheckout('pro')}
                    disabled={checkoutLoading}
                    loading={checkoutLoading}
                  >
                    {proCtaLabel}
                  </Button>
                )
              }
            />
          ) : null}

          <PricingPlanCard
            variant="team"
            title={team.name}
            description={
              teamIncluded
                ? 'Already on your account. Nothing new to pay.'
                : team.description
            }
            price={teamDisplay.price}
            priceSuffix={teamDisplay.priceSuffix}
            priceSubline={teamDisplay.subline}
            features={PUBLIC_PRICING_TEAM_PLAN_FEATURES}
            badgeLabel={
              teamIncluded
                ? 'Included'
                : isTeamSubscriber
                  ? 'Current plan'
                  : undefined
            }
            footer={
              teamIncluded ? (
                <p className="text-center text-sm text-zinc-400">
                  You can keep adding people on your current plan.
                </p>
              ) : isTeamSubscriber ? (
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
                  variant={isProSubscriber ? 'inverse' : 'secondary'}
                  className="w-full"
                  onClick={() => handleCheckout('team')}
                  disabled={checkoutLoading}
                  loading={checkoutLoading}
                >
                  Get Team
                </Button>
              )
            }
          />
        </div>
      </div>
    </main>
  );
};
