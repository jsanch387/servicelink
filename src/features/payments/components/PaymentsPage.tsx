'use client';

import React from 'react';
import { PaymentsBalanceAndStripeSection } from './PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from './PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from './PaymentsDepositSettingsCard';
import {
  FREE_PAYMENTS_UPSELL_DESCRIPTION_MAIN,
  FREE_PAYMENTS_UPSELL_TITLE,
  FreePaymentPreview,
} from '../free-payment-preview';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsViewTransactionsLink } from './PaymentsViewTransactionsLink';

export interface PaymentsPageProps {
  hasProAccess: boolean;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ hasProAccess }) => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <PaymentsPageHeader showProUpsellLabel={!hasProAccess} />
        {hasProAccess ? (
          <>
            <PaymentsBalanceAndStripeSection />
            <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
              <PaymentsCheckoutOptionsCard />
              <PaymentsDepositSettingsCard />
            </div>
            <PaymentsViewTransactionsLink />
          </>
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
