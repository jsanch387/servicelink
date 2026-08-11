'use client';

import { ROUTES } from '@/constants/routes';
import { ProPaymentsSetupExperience } from '@/features/payments/payments-setup';
import React from 'react';

interface SubscriptionsConnectGateProps {
  resumeConnect?: boolean;
  stripeRestricted?: boolean;
}

/**
 * Pro but Connect not ready — same Stripe setup flow as Payments.
 * Returns to Subscriptions after Connect so the next gate can show.
 */
export const SubscriptionsConnectGate: React.FC<
  SubscriptionsConnectGateProps
> = ({ resumeConnect = false, stripeRestricted = false }) => {
  return (
    <div className="w-full">
      <p className="mt-4 max-w-2xl text-sm text-zinc-500">
        Finish Stripe setup to collect membership payments on your connected
        account — same setup as Payments.
      </p>
      <ProPaymentsSetupExperience
        resumeConnect={resumeConnect}
        stripeRestricted={stripeRestricted}
        webReturnPath={ROUTES.DASHBOARD.SUBSCRIPTIONS}
        showLockedPreview={false}
      />
    </div>
  );
};
