'use client';

import {
  QUOTE_CARD_MIN_CENTS,
  depositDueCents,
  formatUsdFromCents,
  type QuotePaymentCollection,
  type QuoteSendPaymentOffer,
} from '@/features/quotes/shared/quotePaymentCollection';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useEffect } from 'react';

export type { QuoteSendPaymentOffer };

type QuoteSendPaymentChoiceProps = {
  offer: QuoteSendPaymentOffer;
  totalCents: number;
  value: QuotePaymentCollection;
  onChange: (next: QuotePaymentCollection) => void;
};

const OPTIONS: Array<{
  id: QuotePaymentCollection;
  label: string;
  detail: string;
}> = [
  {
    id: 'none',
    label: 'No payment required',
    detail: 'Customer accepts or declines',
  },
  {
    id: 'deposit',
    label: 'Require a deposit',
    detail: 'Uses the deposit in Payments',
  },
  {
    id: 'full',
    label: 'Require full payment',
    detail: 'Customer pays the quote total',
  },
  {
    id: 'customer_choice',
    label: 'Let the customer choose',
    detail: 'Deposit, full payment, or pay in person',
  },
];

function paymentGates(offer: QuoteSendPaymentOffer, totalCents: number) {
  const due = offer.depositsEnabled
    ? depositDueCents(totalCents, offer.depositType, offer.depositValue)
    : 0;
  const depositOk = offer.depositsEnabled && due >= QUOTE_CARD_MIN_CENTS;
  const fullOk = totalCents >= QUOTE_CARD_MIN_CENTS;
  return { due, depositOk, fullOk };
}

export function quotePaymentCollectionSummary(
  offer: QuoteSendPaymentOffer,
  totalCents: number,
  value: QuotePaymentCollection
): { label: string; detail: string } {
  const option = OPTIONS.find(row => row.id === value) ?? OPTIONS[0];
  const { due, depositOk, fullOk } = paymentGates(offer, totalCents);
  if (option.id === 'deposit' && depositOk) {
    return {
      label: option.label,
      detail: `${formatUsdFromCents(due)} due to book`,
    };
  }
  if (option.id === 'full' && fullOk) {
    return {
      label: option.label,
      detail: `${formatUsdFromCents(totalCents)} due to book`,
    };
  }
  if (option.id === 'customer_choice' && !offer.depositsEnabled) {
    return {
      label: option.label,
      detail: 'Full payment or pay in person',
    };
  }
  return { label: option.label, detail: option.detail };
}

export const QuoteSendPaymentChoice: React.FC<QuoteSendPaymentChoiceProps> = ({
  offer,
  totalCents,
  value,
  onChange,
}) => {
  const { depositOk, fullOk } = paymentGates(offer, totalCents);

  useEffect(() => {
    if (value === 'deposit' && !depositOk) onChange('none');
    if (value === 'full' && !fullOk) onChange('none');
  }, [depositOk, fullOk, onChange, value]);

  if (!offer.available) return null;

  const disabledFor = (id: QuotePaymentCollection) => {
    if (id === 'deposit') return !depositOk;
    if (id === 'full') return !fullOk;
    return false;
  };

  return (
    <div>
      <div
        className="overflow-hidden rounded-[10px] border border-white/[0.08] bg-white/[0.03]"
        role="radiogroup"
        aria-label="Payment to accept"
      >
        {OPTIONS.map((option, index) => {
          const disabled = disabledFor(option.id);
          const selected = value === option.id;
          const summary = quotePaymentCollectionSummary(
            offer,
            totalCents,
            option.id
          );
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`flex w-full min-h-11 cursor-pointer touch-manipulation items-center justify-between gap-3 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                index > 0 ? 'border-t border-white/[0.08]' : ''
              } ${
                selected
                  ? 'bg-white/[0.06] text-white'
                  : 'text-zinc-300 hover:bg-white/[0.04] disabled:hover:bg-transparent'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">
                  {summary.label}
                </span>
                <span className="mt-0.5 block text-sm text-white/60">
                  {summary.detail}
                </span>
              </span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {selected ? (
                  <CheckIcon className="h-5 w-5 text-white" aria-hidden />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {!offer.depositsEnabled ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-white/60">
          <InformationCircleIcon
            className="mt-0.5 h-4 w-4 shrink-0 text-white/60"
            aria-hidden
          />
          <span>Turn on deposits in Payments to require a deposit.</span>
        </p>
      ) : null}
    </div>
  );
};
