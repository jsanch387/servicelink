'use client';

import { PaymentsBalanceAndStripeSection } from '@/features/payments/components/PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from '@/features/payments/components/PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from '@/features/payments/components/PaymentsDepositSettingsCard';
import { PaymentsViewTransactionsLink } from '@/features/payments/components/PaymentsViewTransactionsLink';
import React from 'react';
import { LockedPaymentPreviewSection } from './LockedPaymentPreviewSection';

type PreviewSectionConfig = {
  id: string;
  lockedLabel: string;
  content: React.ReactNode;
};

const FREE_PAYMENTS_PREVIEW_SECTIONS: PreviewSectionConfig[] = [
  {
    id: 'balance',
    lockedLabel: 'Available balance (preview, locked)',
    content: (
      <PaymentsBalanceAndStripeSection showStripeDashboardCard={false} />
    ),
  },
  {
    id: 'checkout',
    lockedLabel: 'Checkout options (preview, locked)',
    content: <PaymentsCheckoutOptionsCard />,
  },
  {
    id: 'deposits',
    lockedLabel: 'Deposit settings (preview, locked)',
    content: <PaymentsDepositSettingsCard />,
  },
  {
    id: 'activity',
    lockedLabel: 'Transaction activity (preview, locked)',
    content: <PaymentsViewTransactionsLink noTopMargin />,
  },
];

export interface FreePaymentPreviewLockedDashboardProps {
  className?: string;
}

/**
 * Dimmed, locked-by-default preview of the payments dashboard — shared by the
 * free-tier home preview and the Pro Stripe setup tease.
 */
export const FreePaymentPreviewLockedDashboard: React.FC<
  FreePaymentPreviewLockedDashboardProps
> = ({ className }) => {
  const rootClass = ['space-y-8 sm:space-y-10', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {FREE_PAYMENTS_PREVIEW_SECTIONS.map(({ id, lockedLabel, content }) => (
        <LockedPaymentPreviewSection key={id} lockedLabel={lockedLabel}>
          {content}
        </LockedPaymentPreviewSection>
      ))}
    </div>
  );
};
