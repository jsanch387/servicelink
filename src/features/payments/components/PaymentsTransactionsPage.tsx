'use client';

import React from 'react';
import {
  FREE_PAYMENTS_UPSELL_DESCRIPTION_TRANSACTIONS,
  FREE_PAYMENTS_UPSELL_TITLE,
  FreePaymentTransactionsLockedPreview,
  PaymentsProTeaserBanner,
} from '../free-payment-preview';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsStripeConnectNotice } from './PaymentsStripeConnectNotice';
import { PaymentsTransactionsList } from './PaymentsTransactionsList';

export interface PaymentsTransactionsPageProps {
  hasProAccess: boolean;
  stripeConnectReady?: boolean;
}

export const PaymentsTransactionsPage: React.FC<
  PaymentsTransactionsPageProps
> = ({ hasProAccess, stripeConnectReady = false }) => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        {!hasProAccess ? (
          <PaymentsProTeaserBanner
            className="mb-6"
            title={FREE_PAYMENTS_UPSELL_TITLE}
            description={FREE_PAYMENTS_UPSELL_DESCRIPTION_TRANSACTIONS}
          />
        ) : null}

        <PaymentsPageHeader showProUpsellLabel={!hasProAccess} />

        {hasProAccess && !stripeConnectReady ? (
          <PaymentsStripeConnectNotice />
        ) : null}

        {hasProAccess ? (
          <PaymentsTransactionsList stripeConnectReady={stripeConnectReady} />
        ) : (
          <FreePaymentTransactionsLockedPreview />
        )}
      </div>
    </main>
  );
};
