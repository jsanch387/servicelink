'use client';

import { ROUTES } from '@/constants/routes';
import { formatInvoiceCents } from '@/features/invoices/utils/invoiceDraft';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { InvoiceListItem, InvoiceStatus } from '../types';
import { DeleteInvoiceButton } from './DeleteInvoiceButton';
import { MarkInvoicePaidButton } from './MarkInvoicePaidButton';
import { VoidInvoiceButton } from './VoidInvoiceButton';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  void: 'Void',
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: 'bg-white/10 text-zinc-300',
  sent: 'bg-sky-400/15 text-sky-200',
  paid: 'bg-emerald-400/15 text-emerald-200',
  void: 'bg-white/5 text-zinc-500',
};

function customerName(invoice: InvoiceListItem): string {
  return invoice.customerName.trim() || 'Untitled';
}

function invoiceReference(invoice: InvoiceListItem): string {
  return invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : '—';
}

function dueDateLabel(invoice: InvoiceListItem): string {
  if (!invoice.dueOn) return 'No due date';
  const date = new Date(`${invoice.dueOn.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const menuItemClassName =
  'flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10';

function InvoiceRowMenu({
  invoice,
  label,
  onDeleted,
  onStatusChange,
}: {
  invoice: InvoiceListItem;
  label: string;
  onDeleted: (invoiceId: string) => void;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
        width: 176,
        zIndex: 80,
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="relative inline-flex"
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
    >
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-white focus-visible:outline-none"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Actions for ${label}`}
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
            >
              {invoice.status === 'sent' ? (
                <>
                  <MarkInvoicePaidButton
                    invoiceId={invoice.id}
                    onUpdated={() => onStatusChange(invoice.id, 'paid')}
                    trigger={openModal => (
                      <button
                        type="button"
                        role="menuitem"
                        className={menuItemClassName}
                        onClick={() => {
                          setOpen(false);
                          openModal();
                        }}
                      >
                        Mark as paid
                      </button>
                    )}
                  />
                  <VoidInvoiceButton
                    invoiceId={invoice.id}
                    onUpdated={() => onStatusChange(invoice.id, 'void')}
                    trigger={openModal => (
                      <button
                        type="button"
                        role="menuitem"
                        className={menuItemClassName}
                        onClick={() => {
                          setOpen(false);
                          openModal();
                        }}
                      >
                        Void
                      </button>
                    )}
                  />
                </>
              ) : null}
              <DeleteInvoiceButton
                invoiceId={invoice.id}
                onDeleted={() => onDeleted(invoice.id)}
                trigger={openModal => (
                  <button
                    type="button"
                    role="menuitem"
                    className={`${menuItemClassName} text-red-400 hover:text-red-300`}
                    onClick={() => {
                      setOpen(false);
                      openModal();
                    }}
                  >
                    Delete
                  </button>
                )}
              />
            </div>,
            document.body
          )
        : null}
    </span>
  );
}

export const InvoicesTable: React.FC<{
  invoices: InvoiceListItem[];
  canDelete: boolean;
  onDeleted: (invoiceId: string) => void;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
}> = ({ invoices, canDelete, onDeleted, onStatusChange }) => {
  const router = useRouter();

  const openInvoice = (invoiceId: string) => {
    router.push(ROUTES.DASHBOARD.INVOICE(invoiceId));
  };

  return (
    <>
      <div className="hidden overflow-visible rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Due date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
              {canDelete ? (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => {
              const name = customerName(invoice);
              return (
                <tr
                  key={invoice.id}
                  tabIndex={0}
                  aria-label={`Open invoice for ${name}`}
                  onClick={() => openInvoice(invoice.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openInvoice(invoice.id);
                    }
                  }}
                  className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                >
                  <td className="max-w-[16rem] px-4 py-3.5 align-middle">
                    <span className="block truncate text-sm font-semibold text-white">
                      {name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-300">
                    {invoiceReference(invoice)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-300">
                    {dueDateLabel(invoice)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-sm font-medium tabular-nums text-white">
                    {formatInvoiceCents(invoice.totalCents)}
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <StatusPill status={invoice.status} />
                  </td>
                  {canDelete ? (
                    <td className="px-4 py-3.5 text-right align-middle">
                      <InvoiceRowMenu
                        invoice={invoice}
                        label={name}
                        onDeleted={onDeleted}
                        onStatusChange={onStatusChange}
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex list-none flex-col gap-3 md:hidden">
        {invoices.map(invoice => {
          const name = customerName(invoice);
          return (
            <li
              key={invoice.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={ROUTES.DASHBOARD.INVOICE(invoice.id)}
                  className="min-w-0 flex-1 cursor-pointer outline-none"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 truncate text-base font-semibold text-white">
                      {name}
                    </span>
                    <StatusPill status={invoice.status} />
                  </span>
                </Link>
                {canDelete ? (
                  <InvoiceRowMenu
                    invoice={invoice}
                    label={name}
                    onDeleted={onDeleted}
                    onStatusChange={onStatusChange}
                  />
                ) : null}
              </div>
              <Link
                href={ROUTES.DASHBOARD.INVOICE(invoice.id)}
                className="mt-3 block cursor-pointer outline-none"
              >
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Invoice</dt>
                    <dd className="text-gray-200">
                      {invoiceReference(invoice)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Due date</dt>
                    <dd className="text-gray-200">{dueDateLabel(invoice)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Amount</dt>
                    <dd className="font-medium tabular-nums text-white">
                      {formatInvoiceCents(invoice.totalCents)}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
};
