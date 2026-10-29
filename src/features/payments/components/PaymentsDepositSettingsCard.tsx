'use client';

import { GlassCard, Input, MoneyInput, Switch } from '@/components/shared';
import { fieldLabelClassName } from '@/components/shared/fieldStyles';
import type { DepositAmountMode } from '@/features/payments/types/depositAmountMode';
import React from 'react';

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

export interface PaymentsDepositSettingsCardProps {
  depositsEnabled: boolean;
  onDepositsEnabledChange: (enabled: boolean) => void;
  depositMode: DepositAmountMode;
  onDepositModeChange: (mode: DepositAmountMode) => void;
  depositAmount: string;
  onDepositAmountChange: (amount: string) => void;
}

export const PaymentsDepositSettingsCard: React.FC<
  PaymentsDepositSettingsCardProps
> = ({
  depositsEnabled,
  onDepositsEnabledChange,
  depositMode,
  onDepositModeChange,
  depositAmount,
  onDepositAmountChange,
}) => {
  const setDepositModeAndClamp = (next: DepositAmountMode) => {
    onDepositModeChange(next);
    if (next === 'percentage') {
      const n = parseFloat(depositAmount);
      if (!Number.isNaN(n) && n > 100) {
        onDepositAmountChange('100');
      }
    }
  };

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white">Deposits</h2>
        <p className="mt-1 text-sm text-white/60">
          Collect part of the price when someone books.
        </p>

        <div className="mt-6">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
            <Switch
              checked={depositsEnabled}
              onCheckedChange={onDepositsEnabledChange}
              size="sm"
              label="Require deposits"
            />
          </div>

          {depositsEnabled ? (
            <div className="mt-6">
              <label htmlFor="deposit-amount" className={fieldLabelClassName}>
                Deposit amount
              </label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  {depositMode === 'fixed' ? (
                    <MoneyInput
                      id="deposit-amount"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={onDepositAmountChange}
                    />
                  ) : (
                    <Input
                      id="deposit-amount"
                      value={depositAmount}
                      onChange={value =>
                        onDepositAmountChange(sanitizePercentageDeposit(value))
                      }
                      placeholder="0"
                      inputMode="decimal"
                      autoComplete="off"
                      suffix="%"
                    />
                  )}
                </div>
                <div
                  className="flex h-8 shrink-0 items-center rounded-lg border border-white/15 bg-white/[0.04] p-0.5"
                  role="group"
                  aria-label="Dollars or percent"
                >
                  <button
                    type="button"
                    onClick={() => setDepositModeAndClamp('fixed')}
                    aria-pressed={depositMode === 'fixed'}
                    className={`flex h-full min-w-9 cursor-pointer items-center justify-center rounded-md px-2.5 text-sm font-semibold transition-colors duration-200 touch-manipulation ${
                      depositMode === 'fixed'
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositModeAndClamp('percentage')}
                    aria-pressed={depositMode === 'percentage'}
                    className={`flex h-full min-w-9 cursor-pointer items-center justify-center rounded-md px-2.5 text-sm font-semibold transition-colors duration-200 touch-manipulation ${
                      depositMode === 'percentage'
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-white/60">
                {depositMode === 'fixed'
                  ? 'Fixed amount in dollars.'
                  : 'Percent of the service cost.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
};
