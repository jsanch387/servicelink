'use client';

import { ROUTES } from '@/constants/routes';
import { formatInvoiceCents } from '@/features/invoices/utils/invoiceDraft';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import type { InvoiceListItem, InvoiceStatus } from '../types';

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

export const InvoicesTable: React.FC<{ invoices: InvoiceListItem[] }> = ({
  invoices,
}) => {
  const router = useRouter();

  const openInvoice = (invoiceId: string) => {
    router.push(ROUTES.DASHBOARD.INVOICE(invoiceId));
  };

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
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
            <li key={invoice.id}>
              <Link
                href={ROUTES.DASHBOARD.INVOICE(invoice.id)}
                className="block cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-4 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-base font-semibold text-white">
                    {name}
                  </p>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusPill status={invoice.status} />
                    <EllipsisHorizontalIcon
                      className="h-5 w-5 text-gray-500"
                      aria-hidden
                    />
                  </span>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
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
