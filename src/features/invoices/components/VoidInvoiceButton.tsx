'use client';

import { Button, Modal, toast } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export const VoidInvoiceButton: React.FC<{
  invoiceId: string;
  trigger?: (open: () => void) => React.ReactNode;
}> = ({ invoiceId, trigger }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setOpen(false);
  };

  const voidInvoice = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(API_ROUTES.INVOICE_VOID(invoiceId), {
        method: 'POST',
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !json?.success) {
        toast.error(json?.error || 'Could not void this invoice.');
        setBusy(false);
        return;
      }

      toast.success('Invoice voided');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Could not void this invoice.');
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
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Void
        </Button>
      )}
      <Modal
        isOpen={open}
        onClose={close}
        title="Void invoice"
        maxWidth="sm"
        preventClose={busy}
      >
        <p className="mb-6 text-sm text-gray-300">
          This bill stays on record. The link will show Void, and it can no
          longer be paid.
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
            onClick={() => void voidInvoice()}
            className="w-full"
          >
            Void invoice
          </Button>
        </div>
      </Modal>
    </>
  );
};
