'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useEffect, useState } from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import { getPublicProfileMembershipsApiPath } from '../utils/getPublicProfileMembershipsApiPath';
import { PublicSubscriptionsSection } from './PublicSubscriptionsSection';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface LazyPublicSubscriptionsSectionProps {
  businessSlug: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Fetch when the Subscriptions tab is active. */
  isActive: boolean;
}

export const LazyPublicSubscriptionsSection: React.FC<
  LazyPublicSubscriptionsSectionProps
> = ({ businessSlug, bookingFlowLocale = 'en', isActive }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [plans, setPlans] = useState<CustomerSubscriptionPlan[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  const fetchPlans = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch(
        getPublicProfileMembershipsApiPath(businessSlug),
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: { plans?: CustomerSubscriptionPlan[] };
        error?: string;
      };

      if (!res.ok || !json.success || !json.data?.plans) {
        setLoadState('error');
        return;
      }

      setPlans(json.data.plans);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [businessSlug]);

  useEffect(() => {
    if (!isActive) return;
    if (plans || loadState === 'loading') return;
    if (loadState === 'ready' || loadState === 'error') return;
    void fetchPlans();
  }, [isActive, plans, loadState, fetchPlans]);

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <section
        className="space-y-3 px-4 py-5 sm:px-8 sm:py-6"
        aria-busy="true"
        aria-label={ui.subscriptions.plansLoadingAriaLabel}
      >
        {[0, 1].map(i => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-white/[0.06] sm:h-40"
          />
        ))}
      </section>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="px-4 py-8 text-center sm:px-8">
        <p className="text-sm text-zinc-500">
          {ui.subscriptions.plansLoadError}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadState('idle');
            void fetchPlans();
          }}
          className="mt-3 cursor-pointer text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline touch-manipulation"
        >
          {ui.subscriptions.plansRetry}
        </button>
      </div>
    );
  }

  return (
    <PublicSubscriptionsSection
      plans={plans ?? []}
      bookingFlowLocale={bookingFlowLocale}
      businessSlug={businessSlug}
    />
  );
};
