import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';
import React from 'react';
import { formatMembershipAmountCents } from '../utils/formatSubscriptionPrice';

/**
 * Quiet tax line under a membership price. Hidden when this price has no tax.
 * The price above stays pre-tax. The total is what the customer is charged.
 */
export function MembershipTaxCaption({
  priceCents,
  taxCents,
  taxRateBps,
  align = 'end',
}: {
  priceCents: number;
  taxCents?: number;
  taxRateBps?: number;
  align?: 'end' | 'center' | 'start';
}) {
  if (!taxCents || taxCents <= 0) return null;
  const total = Math.max(0, Math.round(priceCents)) + taxCents;
  const rate = formatSalesTaxRateLabel(taxRateBps ?? 0);
  const label = rate ? `Tax (${rate})` : 'Tax';
  return (
    <p
      className={`mt-0.5 text-xs leading-4 text-zinc-500 ${
        align === 'center'
          ? 'text-center'
          : align === 'start'
            ? 'text-left'
            : 'text-right'
      }`}
    >
      {label} {formatMembershipAmountCents(taxCents)}
      <span className="text-zinc-600"> · </span>
      <span className="text-zinc-300">
        {formatMembershipAmountCents(total)} total
      </span>
    </p>
  );
}
