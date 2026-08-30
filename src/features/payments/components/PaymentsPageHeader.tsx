'use client';

import { ProFeatureLabel } from '@/features/dashboard';
import React from 'react';
import { PaymentsSectionNav } from './PaymentsSectionNav';

export interface PaymentsPageHeaderProps {
  /** When true, show the Pro pill beside the page title (free-tier payments). */
  showProUpsellLabel?: boolean;
}

export const PaymentsPageHeader: React.FC<PaymentsPageHeaderProps> = ({
  showProUpsellLabel = false,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          Payments
        </h1>
        {showProUpsellLabel ? <ProFeatureLabel /> : null}
      </div>
      <PaymentsSectionNav />
    </div>
  );
};
