'use client';

import React from 'react';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsRevenueChart } from './PaymentsRevenueChart';
import { PaymentsStripeConnectNotice } from './PaymentsStripeConnectNotice';

export function PaymentsRevenuePage({
  showStripeConnectNotice = false,
}: {
  showStripeConnectNotice?: boolean;
}) {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <PaymentsPageHeader />
        {showStripeConnectNotice ? <PaymentsStripeConnectNotice /> : null}
        <PaymentsRevenueChart />
      </div>
    </main>
  );
}
