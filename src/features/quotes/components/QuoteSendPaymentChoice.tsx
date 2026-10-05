'use client';

import {
  QUOTE_CARD_MIN_CENTS,
  depositDueCents,
  formatUsdFromCents,
  type QuotePaymentCollection,
  type QuoteSendPaymentOffer,
} from '@/features/quotes/shared/quotePaymentCollection';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useId } from 'react';

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

export const QuoteSendPaymentChoice: React.FC<QuoteSendPaymentChoiceProps> = ({
  offer,
  totalCents,
  value,
  onChange,
}) => {
  const due = offer.depositsEnabled
    ? depositDueCents(totalCents, offer.depositType, offer.depositValue)
    : 0;
  const depositOk = offer.depositsEnabled && due >= QUOTE_CARD_MIN_CENTS;
  const fullOk = totalCents >= QUOTE_CARD_MIN_CENTS;
  const choiceOk = depositOk && fullOk;

  useEffect(() => {
    if (value === 'deposit' && !depositOk) onChange('none');
    if (value === 'full' && !fullOk) onChange('none');
    if (value === 'customer_choice' && !choiceOk) onChange('none');
  }, [choiceOk, depositOk, fullOk, onChange, value]);

  const labelId = useId();

  if (!offer.available) return null;

  const disabledFor = (id: QuotePaymentCollection) => {
    if (id === 'deposit') return !depositOk;
    if (id === 'full') return !fullOk;
    if (id === 'customer_choice') return !choiceOk;
    return false;
  };

  const detailFor = (id: QuotePaymentCollection, detail: string) => {
    if (id === 'deposit' && depositOk) {
      return `${formatUsdFromCents(due)} due to book`;
    }
    if (id === 'full' && fullOk) {
      return `${formatUsdFromCents(totalCents)} due to book`;
    }
    return detail;
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-500" id={labelId}>
        Payment to accept
      </p>
      <div className="space-y-2" role="radiogroup" aria-labelledby={labelId}>
        {OPTIONS.map(option => {
          const disabled = disabledFor(option.id);
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06] disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-sm text-gray-400">
                  {detailFor(option.id, option.detail)}
                </span>
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  selected
                    ? 'border-white/40 bg-white/20'
                    : 'border-white/20 bg-transparent'
                }`}
                aria-hidden
              >
                {selected ? (
                  <CheckIcon className="h-3.5 w-3.5 text-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {!offer.depositsEnabled ? (
        <p className="mt-2 text-sm text-gray-400">
          Turn on deposits in Payments to require a deposit or let the customer
          choose.
        </p>
      ) : null}
    </div>
  );
};
