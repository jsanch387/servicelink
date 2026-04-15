'use client';

import { Button, GlassCard, MoneyInput, Switch } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import type { DepositAmountMode } from '@/features/payments/types/depositAmountMode';
import {
  centsToMoneyInputString,
  dollarsStringToCents,
} from '@/features/payments/utils/paymentSettingsMaps';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function sanitizePercentageDeposit(raw: string): string {
  const s = raw.replace(/[^0-9.]/g, '');
  if (s === '') return '';

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    const n = parseInt(s, 10);
    if (Number.isNaN(n)) return '';
    if (n > 100) return '100';
    return String(n);
  }

  let intPart = s.slice(0, firstDot).replace(/\./g, '');
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  if (intPart === '') intPart = '0';

  const intNum = parseInt(intPart, 10);
  const safeInt = Number.isNaN(intNum) ? 0 : intNum;
  if (safeInt > 100) return '100';
  if (safeInt === 100 && decPart.length > 0) return '100';

  if (s.endsWith('.') && decPart.length === 0) {
    return `${safeInt}.`;
  }
  return decPart.length > 0 ? `${safeInt}.${decPart}` : String(safeInt);
}

function clampPercentageAt100(value: string): string {
  if (value === '') return value;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  if (n > 100) return '100';
  return value;
}

function dbDepositTypeToUi(t: 'fixed' | 'percent'): DepositAmountMode {
  return t === 'percent' ? 'percentage' : 'fixed';
}

function uiDepositModeToDb(mode: DepositAmountMode): 'fixed' | 'percent' {
  return mode === 'percentage' ? 'percent' : 'fixed';
}

export interface PaymentsDepositSettingsCardProps {
  initialDepositsEnabled: boolean;
  initialDepositType: 'fixed' | 'percent';
  /** Cents for fixed, whole percent for percent. */
  initialDepositValue: number;
}

export const PaymentsDepositSettingsCard: React.FC<
  PaymentsDepositSettingsCardProps
> = ({ initialDepositsEnabled, initialDepositType, initialDepositValue }) => {
  const router = useRouter();

  const initialMode = dbDepositTypeToUi(initialDepositType);
  const initialAmountStr =
    initialDepositType === 'fixed'
      ? centsToMoneyInputString(initialDepositValue)
      : String(Number.isFinite(initialDepositValue) ? initialDepositValue : 0);

  const [savedRequireDeposit, setSavedRequireDeposit] = useState(
    initialDepositsEnabled
  );
  const [savedDepositAmount, setSavedDepositAmount] =
    useState(initialAmountStr);
  const [savedDepositMode, setSavedDepositMode] = useState(initialMode);

  const [requireDeposit, setRequireDeposit] = useState(initialDepositsEnabled);
  const [depositAmount, setDepositAmount] = useState(initialAmountStr);
  const [depositMode, setDepositMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mode = dbDepositTypeToUi(initialDepositType);
    const amountStr =
      initialDepositType === 'fixed'
        ? centsToMoneyInputString(initialDepositValue)
        : String(
            Number.isFinite(initialDepositValue) ? initialDepositValue : 0
          );
    setSavedRequireDeposit(initialDepositsEnabled);
    setSavedDepositAmount(amountStr);
    setSavedDepositMode(mode);
    setRequireDeposit(initialDepositsEnabled);
    setDepositAmount(amountStr);
    setDepositMode(mode);
  }, [initialDepositsEnabled, initialDepositType, initialDepositValue]);

  const isDirty =
    requireDeposit !== savedRequireDeposit ||
    depositAmount !== savedDepositAmount ||
    depositMode !== savedDepositMode;

  const setDepositModeAndClamp = (next: DepositAmountMode) => {
    setDepositMode(next);
    if (next === 'percentage') {
      const n = parseFloat(depositAmount);
      if (!Number.isNaN(n) && n > 100) {
        setDepositAmount('100');
      }
    }
  };

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setError(null);
    const amount =
      depositMode === 'percentage'
        ? clampPercentageAt100(depositAmount)
        : depositAmount;
    if (amount !== depositAmount) {
      setDepositAmount(amount);
    }

    const dbType = uiDepositModeToDb(depositMode);
    let depositValue: number;
    if (depositMode === 'percentage') {
      depositValue = Math.round(parseFloat(amount) || 0);
      depositValue = Math.min(100, Math.max(0, depositValue));
    } else {
      depositValue = dollarsStringToCents(amount);
    }

    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositsEnabled: requireDeposit,
          depositType: dbType,
          depositValue,
        }),
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
      setSavedRequireDeposit(requireDeposit);
      setSavedDepositAmount(amount);
      setSavedDepositMode(depositMode);
      router.refresh();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white">Deposits</h2>
        <p className="mt-1 text-sm text-gray-400">
          Collect part of the price when someone books.
        </p>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <Switch
              checked={requireDeposit}
              onCheckedChange={setRequireDeposit}
              size="sm"
              label="Require deposits"
            />
          </div>

          <div
            className={`space-y-4 transition-opacity ${requireDeposit ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
            aria-hidden={!requireDeposit}
          >
            <div>
              <span className="block text-sm font-medium text-gray-300 mb-1.5">
                Deposit amount
              </span>
              <div className="flex gap-2 items-start">
                <div className="min-w-0 flex-1">
                  {depositMode === 'fixed' ? (
                    <MoneyInput
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={setDepositAmount}
                    />
                  ) : (
                    <div className="relative w-full">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={depositAmount}
                        onChange={e =>
                          setDepositAmount(
                            sanitizePercentageDeposit(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full py-2.5 pl-3.5 pr-9 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-normal tabular-nums focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8 transition-all duration-200 touch-manipulation hover:border-white/20"
                      />
                      <span
                        className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-base sm:text-sm tabular-nums"
                        aria-hidden
                      >
                        %
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className="shrink-0 self-start flex"
                  role="group"
                  aria-label="Dollars or percent"
                >
                  <div className="flex p-1 rounded-lg bg-white/[0.04] border border-white/10 min-h-[42px] sm:min-h-[38px]">
                    <button
                      type="button"
                      onClick={() => setDepositModeAndClamp('fixed')}
                      aria-pressed={depositMode === 'fixed'}
                      className={`min-w-[2.75rem] px-2.5 sm:px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer touch-manipulation ${
                        depositMode === 'fixed'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositModeAndClamp('percentage')}
                      aria-pressed={depositMode === 'percentage'}
                      className={`min-w-[2.75rem] px-2.5 sm:px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer touch-manipulation ${
                        depositMode === 'percentage'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 leading-snug">
                {depositMode === 'fixed'
                  ? 'Fixed amount in dollars.'
                  : 'Percent of the service cost.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 sm:max-w-xs">
            {error ? (
              <span className="text-red-300">{error}</span>
            ) : isDirty ? (
              'Save to keep your changes.'
            ) : (
              'Nothing new to save.'
            )}
          </p>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            disabled={!isDirty || saving}
            loading={saving}
            onClick={() => void handleSave()}
            className="w-full sm:w-auto shrink-0"
          >
            Save changes
          </Button>
        </div>
      </div>

      <footer className="border-t border-white/[0.08] bg-black/20 px-4 py-3.5 sm:px-8 sm:py-3.5">
        <p className="flex gap-2 text-xs sm:text-sm text-gray-400 leading-snug">
          <InformationCircleIcon
            className="h-4 w-4 shrink-0 text-gray-500 mt-0.5"
            aria-hidden
          />
          <span>Deposits up front often mean fewer no-shows.</span>
        </p>
      </footer>
    </GlassCard>
  );
};
