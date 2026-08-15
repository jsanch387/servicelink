'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getPublicMembershipSubscribePath } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import { ManageMembershipModal } from './ManageMembershipModal';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';

interface PublicSubscriptionsSectionProps {
  plans: CustomerSubscriptionPlan[];
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Public profile slug — required to open the subscribe page. */
  businessSlug?: string;
}

export const PublicSubscriptionsSection: React.FC<
  PublicSubscriptionsSectionProps
> = ({ plans, bookingFlowLocale = 'en', businessSlug }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const router = useRouter();
  const [manageOpen, setManageOpen] = useState(false);

  if (plans.length === 0) return null;

  const handleSubscribe = (planId: string, cadenceOptionId: string) => {
    const slug = businessSlug?.trim();
    if (!slug) return;
    router.push(
      getPublicMembershipSubscribePath(slug, {
        planId,
        priceId: cadenceOptionId,
        lang: bookingFlowLocale,
      })
    );
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

      <ManageMembershipModal
        isOpen={manageOpen}
        bookingFlowLocale={bookingFlowLocale}
        businessSlug={businessSlug}
        onClose={() => setManageOpen(false)}
      />
    </section>
  );
};
