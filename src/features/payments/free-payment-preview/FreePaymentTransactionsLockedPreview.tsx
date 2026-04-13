'use client';

import { PaymentsRecentTransactions } from '@/features/payments/components/PaymentsRecentTransactions';
import React from 'react';
import { LockedPaymentPreviewSection } from './LockedPaymentPreviewSection';

/** Free-tier transactions route: dimmed list + lock (below upgrade banner). */
export const FreePaymentTransactionsLockedPreview: React.FC = () => (
  <div className="mt-8">
    <LockedPaymentPreviewSection lockedLabel="Recent transactions (preview, locked)">
      <PaymentsRecentTransactions hideHeading noSectionTopMargin />
    </LockedPaymentPreviewSection>
  </div>
);
