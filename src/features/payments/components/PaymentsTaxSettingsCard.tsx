'use client';

import { GlassCard, Input, Switch } from '@/components/shared';
import { sanitizeSalesTaxPercent } from '@/features/payments/utils/salesTaxRate';
import React from 'react';

export interface PaymentsTaxSettingsCardProps {
  collectTax: boolean;
  onCollectTaxChange: (enabled: boolean) => void;
  taxRate: string;
  onTaxRateChange: (rate: string) => void;
}

export const PaymentsTaxSettingsCard: React.FC<
  PaymentsTaxSettingsCardProps
> = ({ collectTax, onCollectTaxChange, taxRate, onTaxRateChange }) => {
  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white">Sales tax</h2>
        <p className="mt-1 text-sm text-white/60">
          Add a percentage on top of the price.
        </p>

        <div className="mt-6">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
            <Switch
              checked={collectTax}
              onCheckedChange={onCollectTaxChange}
              size="sm"
              label="Collect sales tax"
            />
          </div>

          {collectTax ? (
            <div className="mt-6 sm:max-w-xs">
              <Input
                id="sales-tax-rate"
                label="Tax rate"
                value={taxRate}
                onChange={value =>
                  onTaxRateChange(sanitizeSalesTaxPercent(value))
                }
                maxLength={5}
                placeholder="8.25"
                inputMode="decimal"
                autoComplete="off"
                suffix="%"
              />
              <p className="mt-1.5 text-xs text-white/60">
                Applied to total price.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
};
