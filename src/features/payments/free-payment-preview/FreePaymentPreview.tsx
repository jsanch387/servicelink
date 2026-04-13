'use client';

import { PaymentsBalanceAndStripeSection } from '@/features/payments/components/PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from '@/features/payments/components/PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from '@/features/payments/components/PaymentsDepositSettingsCard';
import { PaymentsViewTransactionsLink } from '@/features/payments/components/PaymentsViewTransactionsLink';
import React from 'react';
import { LockedPaymentPreviewSection } from './LockedPaymentPreviewSection';
import { PaymentsProTeaserBanner } from './PaymentsProTeaserBanner';

export interface FreePaymentPreviewProps {
  upsellTitle: string;
  upsellDescription: string;
}

type PreviewSectionConfig = {
  id: string;
  lockedLabel: string;
  content: React.ReactNode;
};

const FREE_PAYMENTS_PREVIEW_SECTIONS: PreviewSectionConfig[] = [
  {
    id: 'balance',
    lockedLabel: 'Available balance (preview, locked)',
    content: <PaymentsBalanceAndStripeSection showStripeDashboardCard={false} />,
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

/** Free-only payments home: upgrade banner + locked dimmed sections (real layout underneath). */
export const FreePaymentPreview: React.FC<FreePaymentPreviewProps> = ({
  upsellTitle,
  upsellDescription,
}) => (
  <>
    <PaymentsProTeaserBanner
      className="mt-6 sm:mt-8"
      title={upsellTitle}
      description={upsellDescription}
    />
    <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
      {FREE_PAYMENTS_PREVIEW_SECTIONS.map(({ id, lockedLabel, content }) => (
        <LockedPaymentPreviewSection key={id} lockedLabel={lockedLabel}>
          {content}
        </LockedPaymentPreviewSection>
      ))}
    </div>
  </>
);
