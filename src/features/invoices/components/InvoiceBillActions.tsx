'use client';

import { Button, toast } from '@/components/shared';
import { getPublicBillPath } from '@/constants/routes';
import { CheckIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

import { MarkInvoicePaidButton } from './MarkInvoicePaidButton';

import type { InvoiceStatus } from '../types';

export const InvoiceBillActions: React.FC<{
  invoiceId: string;
  status: InvoiceStatus;
  shortCode: string | null;
}> = ({ invoiceId, status, shortCode }) => {
  const [copied, setCopied] = useState(false);
  const [copyTick, setCopyTick] = useState(0);
  const code = shortCode?.trim() ?? '';

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied, copyTick]);

  const copyLink = async () => {
    if (!code) return;
    try {
      const url = `${window.location.origin}${getPublicBillPath(code)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyTick(tick => tick + 1);
    } catch {
      setCopied(false);
      toast.error('Could not copy the invoice link.');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {code ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyLink()}
          aria-label={copied ? 'Copied' : 'Copy link'}
        >
          <span className="grid" aria-live="polite">
            <span
              className={`col-start-1 row-start-1 ${copied ? 'invisible' : ''}`}
            >
              Copy link
            </span>
            <span
              className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 ${copied ? '' : 'invisible'}`}
            >
              <CheckIcon className="h-4 w-4" aria-hidden />
              Copied
            </span>
          </span>
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => toast.warning('PDF download is coming.')}
      >
        Download PDF
      </Button>
      {status === 'sent' ? (
        <MarkInvoicePaidButton invoiceId={invoiceId} />
      ) : null}
    </div>
  );
};
