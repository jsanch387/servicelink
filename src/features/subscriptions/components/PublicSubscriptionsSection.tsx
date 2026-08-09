'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import React, { useState } from 'react';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import { SubscribePlanDetailsModal } from './SubscribePlanDetailsModal';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';

interface PublicSubscriptionsSectionProps {
  plans: CustomerSubscriptionPlan[];
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Wire to Stripe Checkout later. */
  onContinueToCheckout?: (
    planId: string,
    cadenceOptionId: string
  ) => void | Promise<void>;
}

export const PublicSubscriptionsSection: React.FC<
  PublicSubscriptionsSectionProps
> = ({ plans, bookingFlowLocale = 'en', onContinueToCheckout }) => {
  const [selectedPlan, setSelectedPlan] =
    useState<CustomerSubscriptionPlan | null>(null);
  const [selectedCadence, setSelectedCadence] =
    useState<SubscriptionCadenceOption | null>(null);

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

      <SubscribePlanDetailsModal
        isOpen={Boolean(selectedPlan && selectedCadence)}
        plan={selectedPlan}
        cadenceOption={selectedCadence}
        bookingFlowLocale={bookingFlowLocale}
        onClose={handleClose}
        onContinueToCheckout={onContinueToCheckout}
      />
    </section>
  );
};
