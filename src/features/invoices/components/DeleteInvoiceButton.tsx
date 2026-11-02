'use client';

import { Button, IconButton, Modal, toast } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export const DeleteInvoiceButton: React.FC<{
  invoiceId: string;
  /** When set, stay on this screen after a successful delete. */
  onDeleted?: () => void;
  trigger?: (open: () => void) => React.ReactNode;
}> = ({ invoiceId, onDeleted, trigger }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setOpen(false);
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(API_ROUTES.INVOICE(invoiceId), {
        method: 'DELETE',
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !json?.success) {
        toast.error(json?.error || 'Could not delete this invoice.');
        setBusy(false);
        return;
      }

      toast.success('Invoice deleted');
      setOpen(false);
      if (onDeleted) {
        onDeleted();
        return;
      }
      router.push(ROUTES.DASHBOARD.INVOICES);
      router.refresh();
    } catch {
      toast.error('Could not delete this invoice.');
      setBusy(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <IconButton
          variant="danger"
          size="sm"
          aria-label="Delete invoice"
          title="Delete invoice"
          icon={<TrashIcon className="h-4 w-4" />}
          onClick={() => setOpen(true)}
        />
      )}
      <Modal
        isOpen={open}
        onClose={close}
        title="Delete invoice"
        maxWidth="sm"
        preventClose={busy}
      >
        <p className="mb-6 text-sm text-gray-300">
          This permanently removes the invoice and its lines. The customer link
          stops working. A card payment is not refunded.
        </p>
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
            variant="danger"
            loading={busy}
            disabled={busy}
            onClick={() => void remove()}
            className="w-full"
          >
            Delete invoice
          </Button>
        </div>
      </Modal>
    </>
  );
};
