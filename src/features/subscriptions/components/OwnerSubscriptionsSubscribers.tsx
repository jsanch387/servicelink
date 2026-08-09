'use client';

import React from 'react';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';

interface OwnerSubscriptionsSubscribersProps {
  plans: OwnerSubscriptionPlan[];
  /** When set, only show subscribers for this plan. */
  planIdFilter?: string;
}

/**
 * Subscribers list — empty until customer_memberships / Checkout is wired.
 */
export const OwnerSubscriptionsSubscribers: React.FC<
  OwnerSubscriptionsSubscribersProps
> = () => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-white">No subscribers yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        When customers subscribe from your booking link, they&apos;ll show up
        here.
      </p>
    </div>
  );
};
