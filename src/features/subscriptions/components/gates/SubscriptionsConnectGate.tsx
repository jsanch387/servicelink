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
      <ProPaymentsSetupExperience
        resumeConnect={resumeConnect}
        stripeRestricted={stripeRestricted}
        webReturnPath={ROUTES.DASHBOARD.SUBSCRIPTIONS}
        showLockedPreview={false}
      />
    </div>
  );
};
