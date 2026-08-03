'use client';

import { Button, Modal } from '@/components/shared';
import { useEffect, useState } from 'react';
import type { AvailabilityBookingDisplay } from './types';
import {
  resolveCompleteAmountDueCents,
  resolveCompleteCurrency,
} from './utils/resolveCompleteAmountDue';
import {
  WEB_COMPLETE_PAYMENT_METHOD_OPTIONS,
  type WebCompletePaymentMethod,
} from './utils/webCompletePaymentMethods';

export interface CompleteAppointmentConfirmArgs {
  sessionPayment?: {
    method: WebCompletePaymentMethod;
    amountCents: number;
  };
}

export interface CompleteAppointmentModalProps {
  isOpen: boolean;
  booking: AvailabilityBookingDisplay;
  isUpdating?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (args: CompleteAppointmentConfirmArgs) => void | Promise<void>;
}

function formatCurrencyAmount(cents: number, currency: string): string {
  const normalized = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalized,
  }).format(Math.max(0, cents) / 100);
}

export function CompleteAppointmentModal({
  isOpen,
  booking,
  isUpdating = false,
  error = null,
  onClose,
  onConfirm,
}: CompleteAppointmentModalProps) {
  const amountDueCents = resolveCompleteAmountDueCents(booking);
  const currency = resolveCompleteCurrency(booking);
  const needsCollection = amountDueCents > 0;

  const [method, setMethod] = useState<WebCompletePaymentMethod | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMethod(null);
  }, [isOpen, booking.id]);

  const canConfirm = !needsCollection || method != null;

  const handleConfirm = () => {
    if (!canConfirm || isUpdating) return;
    if (needsCollection && method) {
      void onConfirm({
        sessionPayment: { method, amountCents: amountDueCents },
      });
      return;
    }
    void onConfirm({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete appointment"
      maxWidth="sm"
      uniformHorizontalPadding16
      titleClassName="font-bold"
      contentClassName="!pt-4 sm:!pt-5 !pb-4 sm:!pb-5"
      preventClose={isUpdating}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-5 text-center">
          <p className="text-xs font-semibold tracking-wider text-gray-500">
            {needsCollection ? 'Total due' : 'Balance'}
          </p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums text-white">
            {formatCurrencyAmount(amountDueCents, currency)}
          </p>
          {!needsCollection ? (
            <p className="mt-2 text-sm text-emerald-300/90">Already paid</p>
          ) : null}
        </div>

        {needsCollection ? (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
              How was this paid?
            </p>
            <div
              className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.06] p-1"
              role="tablist"
              aria-label="Payment method"
            >
              {WEB_COMPLETE_PAYMENT_METHOD_OPTIONS.map(option => {
                const active = method === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={isUpdating}
                    onClick={() => setMethod(option.id)}
                    className={`cursor-pointer rounded-lg px-2 py-2.5 text-center text-xs font-semibold transition-colors disabled:cursor-not-allowed sm:text-sm ${
                      active
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            disabled={isUpdating}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            fullWidth
            disabled={isUpdating || !canConfirm}
            loading={isUpdating}
            onClick={handleConfirm}
            aria-label={
              isUpdating ? 'Marking appointment complete' : 'Mark as complete'
            }
          >
            Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
