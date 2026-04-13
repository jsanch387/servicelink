'use client';

import { Button, GlassCard } from '@/components/shared';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useId, useState } from 'react';

const OPTIONS: {
  id: CheckoutPaymentMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'in_person',
    title: 'In person only',
    description:
      'Checkout only offers in-person payment. No card payment in the app.',
  },
  {
    id: 'in_app',
    title: 'In the app only',
    description:
      'Checkout only offers card payment in the app. No in-person option.',
  },
  {
    id: 'customer_choice',
    title: 'Customer chooses at checkout',
    description:
      'At checkout they can choose to pay in the app or in person.',
  },
];

export const PaymentsCheckoutOptionsCard: React.FC = () => {
  const [savedMode, setSavedMode] =
    useState<CheckoutPaymentMode>('customer_choice');
  const [selectedMode, setSelectedMode] =
    useState<CheckoutPaymentMode>('customer_choice');
  const groupLabelId = useId();

  const isDirty = selectedMode !== savedMode;

  const handleSave = () => {
    setSavedMode(selectedMode);
  };

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white" id={groupLabelId}>
          How customers pay
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          In the app, in person only, or both at checkout.
        </p>

        <div
          className="mt-6 flex flex-col gap-3"
          role="radiogroup"
          aria-labelledby={groupLabelId}
        >
          {OPTIONS.map(option => {
            const selected = selectedMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedMode(option.id)}
                className={`
                  w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]
                  ${
                    selected
                      ? 'border-emerald-400/40 bg-emerald-500/[0.07] shadow-[0_0_0_1px_rgba(52,211,153,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'
                  }
                `}
              >
                <div className="flex gap-3.5 items-start">
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

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 sm:max-w-xs">
            {isDirty ? 'Save to keep your changes.' : 'Nothing new to save.'}
          </p>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            disabled={!isDirty}
            onClick={handleSave}
            className="w-full sm:w-auto shrink-0"
          >
            Save changes
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
