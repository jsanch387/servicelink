'use client';

import { Button } from '@/components/shared';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { PUBLIC_PRICING_PRO_PLAN_FEATURES } from '../marketingPlanFeatures';
import { PLANS } from '../types';

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
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#171a23] via-[#111218] to-[#0c0d12] p-5 sm:p-7 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 bottom-8 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"
          />

          <div className="relative mb-6 max-w-2xl">
            <p className="inline-flex rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
              ServiceLink Pro
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              {isProSubscriber
                ? 'You are on Pro'
                : isBillingLocked
                  ? 'Get back to Pro access'
                  : 'Unlock everything with Pro'}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-3 leading-relaxed">
              {isProSubscriber
                ? 'Manage billing, payment methods, and cancellation anytime from Stripe.'
                : isBillingLocked
                  ? 'Your account is currently paywalled. Reactivate Pro to restore full access and continue receiving bookings.'
                  : 'One plan, one simple checkout. Start Pro to unlock your full business workflow.'}
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-lg">Pro monthly</p>
                <p className="text-xs text-gray-400 mt-1">
                  Single plan. Cancel anytime.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl leading-none font-semibold text-white">
                  {pro.price}
                </p>
                <p className="text-xs text-gray-400 mt-1">per month</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {PUBLIC_PRICING_PRO_PLAN_FEATURES.map(feature => (
                <div key={feature.text} className="flex items-start gap-2.5">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-indigo-300 mt-[1px]" />
                  <p
                    className={`text-sm ${feature.highlight ? 'text-white font-medium' : 'text-gray-300'}`}
                  >
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
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
                  className="w-full h-12 text-base"
                  onClick={handleUpgradeToPro}
                  disabled={checkoutLoading}
                  loading={checkoutLoading}
                >
                  {isBillingLocked ? 'Reactivate Pro' : 'Upgrade to Pro'}
                </Button>
              )}
              {!isProSubscriber ? (
                <p className="text-center text-xs text-gray-500">
                  Secure Stripe checkout
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
