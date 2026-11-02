'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import {
  STRIPE_FEE_RATES,
  STRIPE_PRICING_LABEL,
  STRIPE_PRICING_URL,
  STRIPE_PROCESSING_FEE_TITLE,
} from '../constants/stripeProcessingFees';

export function PaymentsStripeFeeNote({
  collapsible = false,
  title = STRIPE_PROCESSING_FEE_TITLE,
}: {
  /** Closed until the user opens it. */
  collapsible?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const details = (
    <>
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
    </>
  );

  if (!collapsible) {
    return (
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {details}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <span className="text-sm font-medium text-white">{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? details : null}
    </div>
  );
}
