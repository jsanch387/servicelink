'use client';

import { Button, Modal, toast } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const PAY_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'payment_app', label: 'Payment app' },
  { id: 'other', label: 'Other' },
] as const;

type PayMethod = (typeof PAY_METHODS)[number]['id'];

export const MarkInvoicePaidButton: React.FC<{
  invoiceId: string;
  trigger?: (open: () => void) => React.ReactNode;
}> = ({ invoiceId, trigger }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setMethod(null);
  };

  const markPaid = async () => {
    if (busy || !method) return;
    setBusy(true);
    try {
      const response = await fetch(API_ROUTES.INVOICE_MARK_PAID(invoiceId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !json?.success) {
        toast.error(json?.error || 'Could not update this invoice.');
        setBusy(false);
        return;
      }

      toast.success('Invoice marked paid');
      setOpen(false);
      setMethod(null);
      router.refresh();
    } catch {
      toast.error('Could not update this invoice.');
      setBusy(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button
          type="button"
          variant="inverse"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Mark as paid
        </Button>
      )}
      <Modal
        isOpen={open}
        onClose={close}
        title="Mark as paid"
        maxWidth="sm"
        preventClose={busy}
      >
        <p className="mb-4 text-sm text-gray-300">How was this paid?</p>
        <div
          className="mb-6 flex flex-col gap-2"
          role="radiogroup"
          aria-label="How was this paid?"
        >
          {PAY_METHODS.map(option => {
            const selected = method === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() => setMethod(option.id)}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? 'border-white bg-white text-black'
                    : 'border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={close}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="inverse"
            loading={busy}
            disabled={busy || !method}
            onClick={() => void markPaid()}
            className="w-full"
          >
            Confirm paid
          </Button>
        </div>
      </Modal>
    </>
  );
};
