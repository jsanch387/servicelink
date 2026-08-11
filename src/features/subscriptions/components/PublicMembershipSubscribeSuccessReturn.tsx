'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import { PublicMembershipSubscribeSuccess } from './PublicMembershipSubscribeSuccess';

interface PublicMembershipSubscribeSuccessReturnProps {
  businessSlug: string;
  plan: CustomerSubscriptionPlan | null;
  priceId?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  businessName?: string | null;
  /** Preserve `lang` on Done when the booking link used it. */
  langParam?: string | null;
}

/**
 * Server-rendered checkout success shell: Done returns to the booking link
 * (Subscriptions tab) without flashing the profile first.
 */
export const PublicMembershipSubscribeSuccessReturn: React.FC<
  PublicMembershipSubscribeSuccessReturnProps
> = ({
  businessSlug,
  plan,
  priceId,
  bookingFlowLocale = 'en',
  businessName,
  langParam,
}) => {
  const router = useRouter();
  const slug = businessSlug.trim();

  return (
    <PublicMembershipSubscribeSuccess
      plan={plan}
      priceId={priceId}
      bookingFlowLocale={bookingFlowLocale}
      businessName={businessName}
      onDone={() => {
        if (!slug) {
          router.replace('/');
          return;
        }
        const params = new URLSearchParams();
        params.set('tab', 'subscriptions');
        const lang = langParam?.trim();
        if (lang) params.set('lang', lang);
        router.replace(`/${encodeURIComponent(slug)}?${params.toString()}`);
      }}
    />
  );
};
