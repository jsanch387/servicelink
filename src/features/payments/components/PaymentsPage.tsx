'use client';

import React from 'react';
import {
  FREE_PAYMENTS_UPSELL_DESCRIPTION_MAIN,
  FREE_PAYMENTS_UPSELL_TITLE,
  FreePaymentPreview,
} from '../free-payment-preview';
import {
  PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING,
  ProPaymentsSetupExperience,
} from '../payments-setup';
import { PaymentsBalanceAndStripeSection } from './PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from './PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from './PaymentsDepositSettingsCard';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsViewTransactionsLink } from './PaymentsViewTransactionsLink';

export interface PaymentsPageProps {
  hasProAccess: boolean;
  /**
   * When true, Pro users see the full payments dashboard. When false, Pro users
   * see Connect onboarding UI.
   */
  paymentsSetupComplete?: boolean;
  /**
   * When true, primary CTA should read “continue” (saved `acct_…`, onboarding incomplete).
   */
  stripeConnectResume?: boolean;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  hasProAccess,
  paymentsSetupComplete = false,
  stripeConnectResume = false,
}) => {
  const showProPaymentsDashboard = hasProAccess && paymentsSetupComplete;

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <PaymentsPageHeader
          showProUpsellLabel={!hasProAccess}
          description={
            hasProAccess && !paymentsSetupComplete
              ? PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING
              : undefined
          }
        />
        {showProPaymentsDashboard ? (
          <>
            <PaymentsBalanceAndStripeSection />
            <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
              <PaymentsCheckoutOptionsCard />
              <PaymentsDepositSettingsCard />
            </div>
            <PaymentsViewTransactionsLink />
          </>
        ) : hasProAccess ? (
          <ProPaymentsSetupExperience resumeConnect={stripeConnectResume} />
        ) : (
          <FreePaymentPreview
            upsellTitle={FREE_PAYMENTS_UPSELL_TITLE}
            upsellDescription={FREE_PAYMENTS_UPSELL_DESCRIPTION_MAIN}
          />
        )}
      </div>
    </main>
  );
};
