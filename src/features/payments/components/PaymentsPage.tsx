'use client';

import React from 'react';
import { PaymentsBalanceAndStripeSection } from './PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from './PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from './PaymentsDepositSettingsCard';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsRecentTransactions } from './PaymentsRecentTransactions';

export const PaymentsPage: React.FC = () => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <PaymentsPageHeader />
        <PaymentsBalanceAndStripeSection />
        <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
          <PaymentsCheckoutOptionsCard />
          <PaymentsDepositSettingsCard />
        </div>
        <PaymentsRecentTransactions />
      </div>
    </main>
  );
};
