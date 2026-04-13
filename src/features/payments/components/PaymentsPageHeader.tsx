'use client';

import { ProFeatureLabel } from '@/features/dashboard';
import React from 'react';

const DEFAULT_PAGE_DESCRIPTION = 'Manage balances, deposits, and payouts.';

export interface PaymentsPageHeaderProps {
  /** When true, show the Pro pill beside the page title (free-tier payments). */
  showProUpsellLabel?: boolean;
  /** Overrides the default subtitle under “Payments”. */
  description?: string;
}

export const PaymentsPageHeader: React.FC<PaymentsPageHeaderProps> = ({
  showProUpsellLabel = false,
  description,
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
        {description ?? DEFAULT_PAGE_DESCRIPTION}
      </p>
    </div>
  );
};
