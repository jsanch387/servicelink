'use client';

import { toast } from '@/components/shared';
import { API_ROUTES, type PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useState } from 'react';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import { ManageMembershipModal } from './ManageMembershipModal';
import { SubscribePlanDetailsModal } from './SubscribePlanDetailsModal';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';

interface PublicSubscriptionsSectionProps {
  plans: CustomerSubscriptionPlan[];
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Public profile slug — required to start Checkout. */
  businessSlug?: string;
}

export const PublicSubscriptionsSection: React.FC<
  PublicSubscriptionsSectionProps
> = ({ plans, bookingFlowLocale = 'en', businessSlug }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [selectedPlan, setSelectedPlan] =
    useState<CustomerSubscriptionPlan | null>(null);
  const [selectedCadence, setSelectedCadence] =
    useState<SubscriptionCadenceOption | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  if (plans.length === 0) return null;

  const handleSubscribe = (planId: string, cadenceOptionId: string) => {
    const plan = plans.find(item => item.id === planId) ?? null;
    const cadence =
      plan?.cadenceOptions.find(option => option.id === cadenceOptionId) ??
      null;
    if (!plan || !cadence) return;
    setSelectedPlan(plan);
    setSelectedCadence(cadence);
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setSelectedCadence(null);
  };

  const handleContinueToCheckout = async (
    planId: string,
    cadenceOptionId: string
  ) => {
    const slug = businessSlug?.trim();
    if (!slug) {
      toast.warning(ui.subscriptions.checkoutComingSoon);
      return;
    }

    try {
      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: slug,
          planId,
          priceId: cadenceOptionId,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        error?: string;
      } | null;

      if (!res.ok || !json?.success || !json.url) {
        toast.error(json?.error ?? ui.subscriptions.checkoutStartFailed);
        return;
      }

      window.location.assign(json.url);
    } catch {
      toast.error(ui.subscriptions.checkoutStartFailed);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-8 sm:py-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {plans.map(plan => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            bookingFlowLocale={bookingFlowLocale}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>

      <div className="mt-5 flex justify-center sm:mt-6">
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="cursor-pointer touch-manipulation text-sm font-medium text-zinc-400 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          {ui.subscriptions.manageLinkCta}
        </button>
      </div>

      <SubscribePlanDetailsModal
        isOpen={Boolean(selectedPlan && selectedCadence)}
        plan={selectedPlan}
        cadenceOption={selectedCadence}
        bookingFlowLocale={bookingFlowLocale}
        onClose={handleClose}
        onContinueToCheckout={handleContinueToCheckout}
      />

      <ManageMembershipModal
        isOpen={manageOpen}
        bookingFlowLocale={bookingFlowLocale}
        businessSlug={businessSlug}
        onClose={() => setManageOpen(false)}
      />
    </section>
  );
};
