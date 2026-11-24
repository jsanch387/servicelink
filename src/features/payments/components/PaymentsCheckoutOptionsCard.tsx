'use client';

import { GlassCard } from '@/components/shared';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useId } from 'react';

const OPTIONS: {
  id: CheckoutPaymentMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'in_person',
    title: 'In person only',
    description:
      'You get paid when you meet them. No card is charged through the app.',
  },
  {
    id: 'in_app',
    title: 'In the app only',
    description:
      'They pay in full by card when they book. There is no in-person option.',
  },
  {
    id: 'customer_choice',
    title: 'Customer chooses at checkout',
    description:
      'They choose when they book: card in the app or paying you in person.',
  },
];

export interface PaymentsCheckoutOptionsCardProps {
  checkoutMode: CheckoutPaymentMode | null;
  onCheckoutModeChange: (mode: CheckoutPaymentMode) => void;
}

export const PaymentsCheckoutOptionsCard: React.FC<
  PaymentsCheckoutOptionsCardProps
> = ({ checkoutMode, onCheckoutModeChange }) => {
  const groupLabelId = useId();
  const groupDescriptionId = useId();

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-white" id={groupLabelId}>
          How customers pay
        </h2>
        <p id={groupDescriptionId} className="mt-1 text-sm text-gray-400">
          Choose how customers pay when they book a service with you.
        </p>

        <div
          className="mt-4 flex flex-col gap-2"
          role="radiogroup"
          aria-labelledby={groupLabelId}
          aria-describedby={groupDescriptionId}
        >
          {OPTIONS.map(option => {
            const selected = checkoutMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onCheckoutModeChange(option.id)}
                className={`
                  w-full cursor-pointer rounded-xl border px-3.5 py-3 text-left transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]
                  ${
                    selected
                      ? 'border-emerald-400/40 bg-emerald-500/[0.07] shadow-[0_0_0_1px_rgba(52,211,153,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'
                  }
                `}
              >
                <div className="flex gap-3 items-start">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    aria-hidden
                  >
                    {selected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full border-2 border-white/20 bg-transparent" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <span className="block text-sm font-semibold text-white">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
                      {option.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};
