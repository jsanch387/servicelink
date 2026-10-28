import React from 'react';

import { formatUsdFromCents } from '../quotePaymentCollection';
import { quoteAmountDueCents, quoteSalesTaxLabel } from '../quoteSalesTax';

export function QuoteTaxTotal({
  priceCents,
  taxCents,
  taxRateBps,
  emptyLabel = '—',
  prominent = false,
  embedded = false,
}: {
  priceCents: number;
  taxCents: number;
  taxRateBps: number;
  emptyLabel?: string;
  prominent?: boolean;
  /** Drop the outer box when this sits in a parent card. */
  embedded?: boolean;
}) {
  const due = quoteAmountDueCents(priceCents, taxCents);
  const taxLabel = taxCents > 0 ? quoteSalesTaxLabel(taxRateBps) : null;
  const totalClassName = prominent
    ? 'text-right text-2xl font-bold tabular-nums text-white sm:text-3xl'
    : 'text-lg font-bold tabular-nums text-white';
  const shell = embedded
    ? ''
    : 'rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5';

  if (!taxLabel) {
    return (
      <div className={`flex items-center justify-between gap-4 ${shell}`}>
        <p className="text-sm font-medium text-gray-300">Total</p>
        <p className={totalClassName}>
          {priceCents > 0 ? formatUsdFromCents(priceCents) : emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-4 text-sm text-gray-400">
        <p>Quote</p>
        <p className="tabular-nums text-gray-200">
          {formatUsdFromCents(priceCents)}
        </p>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-4 text-sm text-gray-400">
        <p>{taxLabel}</p>
        <p className="tabular-nums text-gray-200">
          {formatUsdFromCents(taxCents)}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/10 pt-2">
        <p className="text-sm font-medium text-gray-300">Total</p>
        <p className={totalClassName}>{formatUsdFromCents(due)}</p>
      </div>
    </div>
  );
}
