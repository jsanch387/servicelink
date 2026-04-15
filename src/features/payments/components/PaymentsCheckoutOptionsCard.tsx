'use client';

import { Button, GlassCard } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useEffect, useId, useState } from 'react';

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
  /** From `payment_settings.checkout_mode`; null means nothing saved yet. */
  initialCheckoutMode: CheckoutPaymentMode | null;
}

export const PaymentsCheckoutOptionsCard: React.FC<
  PaymentsCheckoutOptionsCardProps
> = ({ initialCheckoutMode }) => {
  const router = useRouter();
  const [savedMode, setSavedMode] = useState<CheckoutPaymentMode | null>(
    initialCheckoutMode
  );
  const [selectedMode, setSelectedMode] = useState<CheckoutPaymentMode | null>(
    initialCheckoutMode
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groupLabelId = useId();
  const groupDescriptionId = useId();

  useEffect(() => {
    setSavedMode(initialCheckoutMode);
    setSelectedMode(initialCheckoutMode);
  }, [initialCheckoutMode]);

  const isDirty = selectedMode !== savedMode;

  const handleSave = async () => {
    if (selectedMode === null || saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutMode: selectedMode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not save. Try again.'
        );
        return;
      }
      setSavedMode(selectedMode);
      router.refresh();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white" id={groupLabelId}>
          How customers pay
        </h2>
        <p id={groupDescriptionId} className="mt-1 text-sm text-gray-400">
          Choose how customers pay when they book a service with you.
        </p>

        <div
          className="mt-6 flex flex-col gap-3"
          role="radiogroup"
          aria-labelledby={groupLabelId}
          aria-describedby={groupDescriptionId}
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
            {error ? (
              <span className="text-red-300">{error}</span>
            ) : selectedMode === null ? (
              'Choose an option, then save.'
            ) : isDirty ? (
              'Save to keep your changes.'
            ) : (
              'Nothing new to save.'
            )}
          </p>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            disabled={!isDirty || selectedMode === null || saving}
            loading={saving}
            onClick={() => void handleSave()}
            className="w-full sm:w-auto shrink-0"
          >
            Save changes
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
