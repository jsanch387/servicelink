'use client';

import { PaymentsTransactionsTable } from '@/features/payments/components/PaymentsTransactionsTable';
import { MOCK_RECENT_TRANSACTIONS } from '@/features/payments/data/mockPayments';
import type { PaymentsTransactionListItem } from '@/features/payments/transactions/publicTransaction';
import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import React from 'react';
import { LockedPaymentPreviewSection } from './LockedPaymentPreviewSection';

const PREVIEW_ITEMS: PaymentsTransactionListItem[] =
  MOCK_RECENT_TRANSACTIONS.map(tx => {
    const refunded = tx.status === 'refunded' || tx.amountCents < 0;
    const formatted = formatPaymentCents(Math.abs(tx.amountCents));
    return {
      id: tx.id,
      kind: refunded ? 'refund' : 'payment',
      title: tx.description,
      extraCount: 0,
      subtitle: tx.customerName,
      methodLabel: '',
      statusLabel:
        tx.status === 'succeeded'
          ? 'Paid'
          : tx.status === 'pending'
            ? 'Pending'
            : 'Refunded',
      amountLabel: refunded ? `−${formatted}` : `+${formatted}`,
      tone: refunded ? 'out' : 'in',
      dateLabel: tx.dateLabel,
      feeLabel: null,
      bookingId: null,
    };
  });

/** Free-tier transactions route: same table as the live screen, dimmed and locked. */
export const FreePaymentTransactionsLockedPreview: React.FC = () => (
  <div className="mt-8">
    <LockedPaymentPreviewSection lockedLabel="Recent transactions (preview, locked)">
      <PaymentsTransactionsTable items={PREVIEW_ITEMS} />
    </LockedPaymentPreviewSection>
  </div>
);
