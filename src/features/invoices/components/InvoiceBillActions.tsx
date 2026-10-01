'use client';

import { Button, toast } from '@/components/shared';
import { API_ROUTES, getPublicBillPath } from '@/constants/routes';
import { CheckIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';

import { MarkInvoicePaidButton } from './MarkInvoicePaidButton';
import { VoidInvoiceButton } from './VoidInvoiceButton';

import type { InvoiceStatus } from '../types';

export const InvoiceBillActions: React.FC<{
  invoiceId: string;
  status: InvoiceStatus;
  shortCode: string | null;
}> = ({ invoiceId, status, shortCode }) => {
  const [copied, setCopied] = useState(false);
  const [copyTick, setCopyTick] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const code = shortCode?.trim() ?? '';

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied, copyTick]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

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

  const downloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(API_ROUTES.INVOICE_PDF(invoiceId));
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(json?.error || 'Could not download this invoice.');
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const match = /filename="([^"]+)"/.exec(
        response.headers.get('Content-Disposition') ?? ''
      );
      link.href = objectUrl;
      link.download = match?.[1] || 'Invoice.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error('Could not download this invoice.');
    } finally {
      setDownloading(false);
    }
  };

  const menuItemClassName =
    'flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div ref={menuRef} className="relative hidden md:block">
        <button
          type="button"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg bg-zinc-800 text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Invoice actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <EllipsisHorizontalIcon className="h-6 w-6" aria-hidden />
        </button>
        <div
          role="menu"
          aria-label="Invoice actions"
          hidden={!menuOpen}
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          {code ? (
            <button
              type="button"
              role="menuitem"
              className={menuItemClassName}
              onClick={() => void copyLink()}
            >
              {copied ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4" aria-hidden />
                  Copied
                </span>
              ) : (
                'Copy link'
              )}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={menuItemClassName}
            disabled={downloading}
            onClick={() => {
              setMenuOpen(false);
              void downloadPdf();
            }}
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          {status === 'sent' ? (
            <div className="mt-1 border-t border-white/10 pt-1">
              <VoidInvoiceButton
                invoiceId={invoiceId}
                trigger={open => (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClassName}
                    onClick={() => {
                      setMenuOpen(false);
                      open();
                    }}
                  >
                    Void
                  </button>
                )}
              />
              <MarkInvoicePaidButton
                invoiceId={invoiceId}
                trigger={open => (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClassName}
                    onClick={() => {
                      setMenuOpen(false);
                      open();
                    }}
                  >
                    Mark as paid
                  </button>
                )}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 md:hidden">
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
          loading={downloading}
          disabled={downloading}
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </Button>
        {status === 'sent' ? (
          <>
            <VoidInvoiceButton invoiceId={invoiceId} />
            <MarkInvoicePaidButton invoiceId={invoiceId} />
          </>
        ) : null}
      </div>
    </div>
  );
};
