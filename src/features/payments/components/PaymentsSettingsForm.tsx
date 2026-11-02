'use client';

import { API_ROUTES } from '@/constants/routes';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import type { DepositAmountMode } from '@/features/payments/types/depositAmountMode';
import type { PaymentSettingsDashboardInitial } from '@/features/payments/types/paymentSettingsDashboard';
import {
  centsToMoneyInputString,
  dollarsStringToCents,
} from '@/features/payments/utils/paymentSettingsMaps';
import {
  MAX_SALES_TAX_PERCENT,
  parseSalesTaxPercent,
  salesTaxBpsToInput,
  salesTaxPercentToBps,
} from '@/features/payments/utils/salesTaxRate';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { PaymentsCheckoutOptionsCard } from './PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from './PaymentsDepositSettingsCard';
import { PaymentsSettingsSaveRow } from './PaymentsSettingsSaveRow';
import { PaymentsTaxSettingsCard } from './PaymentsTaxSettingsCard';

function depositModeFromDb(type: 'fixed' | 'percent'): DepositAmountMode {
  return type === 'percent' ? 'percentage' : 'fixed';
}

function depositAmountFromSettings(
  type: 'fixed' | 'percent',
  value: number
): string {
  if (type === 'fixed') return centsToMoneyInputString(value);
  return String(Number.isFinite(value) ? value : 0);
}

function depositValueForSave(mode: DepositAmountMode, amount: string): number {
  if (mode === 'percentage') {
    const percent = Math.round(parseFloat(amount) || 0);
    return Math.min(100, Math.max(0, percent));
  }
  return dollarsStringToCents(amount);
}

export function PaymentsSettingsForm({
  settings,
  showSalesTaxCard = false,
}: {
  settings: PaymentSettingsDashboardInitial;
  showSalesTaxCard?: boolean;
}) {
  const router = useRouter();

  const [savedCheckoutMode, setSavedCheckoutMode] =
    useState<CheckoutPaymentMode | null>(settings.checkoutMode);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutPaymentMode | null>(
    settings.checkoutMode
  );

  const initialDepositMode = depositModeFromDb(settings.depositType);
  const initialDepositAmount = depositAmountFromSettings(
    settings.depositType,
    settings.depositValue
  );
  const [savedDepositsEnabled, setSavedDepositsEnabled] = useState(
    settings.depositsEnabled
  );
  const [savedDepositMode, setSavedDepositMode] =
    useState<DepositAmountMode>(initialDepositMode);
  const [savedDepositAmount, setSavedDepositAmount] =
    useState(initialDepositAmount);
  const [depositsEnabled, setDepositsEnabled] = useState(
    settings.depositsEnabled
  );
  const [depositMode, setDepositMode] =
    useState<DepositAmountMode>(initialDepositMode);
  const [depositAmount, setDepositAmount] = useState(initialDepositAmount);

  const initialTaxRate = salesTaxBpsToInput(settings.taxRateBps);
  const [savedCollectTax, setSavedCollectTax] = useState(settings.taxEnabled);
  const [savedTaxRate, setSavedTaxRate] = useState(initialTaxRate);
  const [collectTax, setCollectTax] = useState(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState(initialTaxRate);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextMode = depositModeFromDb(settings.depositType);
    const nextAmount = depositAmountFromSettings(
      settings.depositType,
      settings.depositValue
    );
    setSavedCheckoutMode(settings.checkoutMode);
    setCheckoutMode(settings.checkoutMode);
    setSavedDepositsEnabled(settings.depositsEnabled);
    setDepositsEnabled(settings.depositsEnabled);
    setSavedDepositMode(nextMode);
    setDepositMode(nextMode);
    setSavedDepositAmount(nextAmount);
    setDepositAmount(nextAmount);
    const nextTaxRate = salesTaxBpsToInput(settings.taxRateBps);
    setSavedCollectTax(settings.taxEnabled);
    setCollectTax(settings.taxEnabled);
    setSavedTaxRate(nextTaxRate);
    setTaxRate(nextTaxRate);
  }, [
    settings.checkoutMode,
    settings.depositsEnabled,
    settings.depositType,
    settings.depositValue,
    settings.taxEnabled,
    settings.taxRateBps,
  ]);

  const checkoutDirty = checkoutMode !== savedCheckoutMode;
  const depositDirty =
    depositsEnabled !== savedDepositsEnabled ||
    depositMode !== savedDepositMode ||
    depositAmount !== savedDepositAmount;
  const taxDirty =
    showSalesTaxCard &&
    (collectTax !== savedCollectTax || taxRate !== savedTaxRate);
  const parsedTaxRate = parseSalesTaxPercent(taxRate);
  const taxRateInvalid =
    showSalesTaxCard && collectTax && parsedTaxRate == null;
  const isDirty = checkoutDirty || depositDirty || taxDirty;

  const handleSave = async () => {
    if (!isDirty || saving || taxRateInvalid) return;
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (checkoutDirty) {
        if (!checkoutMode) {
          setError('Choose how customers pay.');
          return;
        }
        body.checkoutMode = checkoutMode;
      }
      if (depositDirty) {
        body.depositsEnabled = depositsEnabled;
        body.depositType = depositMode === 'percentage' ? 'percent' : 'fixed';
        body.depositValue = depositValueForSave(depositMode, depositAmount);
      }
      if (showSalesTaxCard && taxDirty) {
        body.taxEnabled = collectTax;
        if (parsedTaxRate != null) {
          body.taxRateBps = salesTaxPercentToBps(parsedTaxRate);
        }
      }

      const res = await fetch(API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not save. Try again.'
        );
        return;
      }

      setSavedCheckoutMode(checkoutMode);
      setSavedDepositsEnabled(depositsEnabled);
      setSavedDepositMode(depositMode);
      setSavedDepositAmount(depositAmount);
      const savedRate = parsedTaxRate == null ? '' : String(parsedTaxRate);
      setTaxRate(collectTax ? savedRate : taxRate);
      setSavedCollectTax(collectTax);
      setSavedTaxRate(collectTax ? savedRate : taxRate);
      router.refresh();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PaymentsCheckoutOptionsCard
        checkoutMode={checkoutMode}
        onCheckoutModeChange={setCheckoutMode}
      />
      <PaymentsDepositSettingsCard
        depositsEnabled={depositsEnabled}
        onDepositsEnabledChange={setDepositsEnabled}
        depositMode={depositMode}
        onDepositModeChange={setDepositMode}
        depositAmount={depositAmount}
        onDepositAmountChange={setDepositAmount}
      />
      {showSalesTaxCard ? (
        <PaymentsTaxSettingsCard
          collectTax={collectTax}
          onCollectTaxChange={setCollectTax}
          taxRate={taxRate}
          onTaxRateChange={setTaxRate}
        />
      ) : null}
      <PaymentsSettingsSaveRow
        isDirty={isDirty}
        saving={saving}
        error={error}
        disabled={taxRateInvalid}
        message={
          taxRateInvalid
            ? `Enter a rate up to ${MAX_SALES_TAX_PERCENT}%.`
            : undefined
        }
        onSave={() => void handleSave()}
      />
    </>
  );
}
