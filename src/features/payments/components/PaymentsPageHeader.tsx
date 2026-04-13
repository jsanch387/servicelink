'use client';

import { ProFeatureLabel } from '@/features/dashboard';
import React from 'react';

export interface PaymentsPageHeaderProps {
  /** When true, show the Pro pill beside the page title (free-tier payments). */
  showProUpsellLabel?: boolean;
}

export const PaymentsPageHeader: React.FC<PaymentsPageHeaderProps> = ({
  showProUpsellLabel = false,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Payments
        </h1>
        {showProUpsellLabel ? <ProFeatureLabel /> : null}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Manage balances, deposits, and payouts.
      </p>
    </div>
  );
};
