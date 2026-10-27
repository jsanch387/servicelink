'use client';

import { PaymentsCheckoutOptionsCard } from '@/features/payments/components/PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from '@/features/payments/components/PaymentsDepositSettingsCard';
import { PaymentsTaxSettingsCard } from '@/features/payments/components/PaymentsTaxSettingsCard';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import type { DepositAmountMode } from '@/features/payments/types/depositAmountMode';
import React, { useState } from 'react';
import { LockedPaymentPreviewSection } from './LockedPaymentPreviewSection';

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
  const [checkoutMode, setCheckoutMode] = useState<CheckoutPaymentMode | null>(
    null
  );
  const [depositsEnabled, setDepositsEnabled] = useState(false);
  const [depositMode, setDepositMode] = useState<DepositAmountMode>(
    'percentage'
  );
  const [depositAmount, setDepositAmount] = useState('0');
  const [collectTax, setCollectTax] = useState(false);
  const [taxRate, setTaxRate] = useState('');

  const rootClass = ['space-y-8 sm:space-y-10', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <LockedPaymentPreviewSection lockedLabel="Checkout options (preview, locked)">
        <PaymentsCheckoutOptionsCard
          checkoutMode={checkoutMode}
          onCheckoutModeChange={setCheckoutMode}
        />
      </LockedPaymentPreviewSection>
      <LockedPaymentPreviewSection lockedLabel="Deposit settings (preview, locked)">
        <PaymentsDepositSettingsCard
          depositsEnabled={depositsEnabled}
          onDepositsEnabledChange={setDepositsEnabled}
          depositMode={depositMode}
          onDepositModeChange={setDepositMode}
          depositAmount={depositAmount}
          onDepositAmountChange={setDepositAmount}
        />
      </LockedPaymentPreviewSection>
      <LockedPaymentPreviewSection lockedLabel="Sales tax (preview, locked)">
        <PaymentsTaxSettingsCard
          collectTax={collectTax}
          onCollectTaxChange={setCollectTax}
          taxRate={taxRate}
          onTaxRateChange={setTaxRate}
        />
      </LockedPaymentPreviewSection>
    </div>
  );
};
