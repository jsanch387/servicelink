import React from 'react';
import {
  STRIPE_FEE_RATES,
  STRIPE_PRICING_LABEL,
  STRIPE_PRICING_URL,
  STRIPE_PROCESSING_FEE_TITLE,
} from '../constants/stripeProcessingFees';

export function PaymentsStripeFeeNote() {
  return (
    <div>
      <p className="text-sm font-medium text-white">
        {STRIPE_PROCESSING_FEE_TITLE}
      </p>
      <dl className="mt-2 space-y-1.5">
        {STRIPE_FEE_RATES.map(row => (
          <div
            key={row.id}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-sm text-zinc-500">{row.label}</dt>
            <dd className="text-sm tabular-nums text-zinc-200">{row.value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={STRIPE_PRICING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex cursor-pointer items-center text-sm text-white underline underline-offset-2 hover:text-zinc-200"
      >
        {STRIPE_PRICING_LABEL}
      </a>
    </div>
  );
}
