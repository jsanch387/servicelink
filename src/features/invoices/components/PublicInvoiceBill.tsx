import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import React from 'react';

import { InvoicePayButton } from './InvoicePayButton';

import type { InvoiceStatus } from '../types';
import {
  formatInvoiceCents,
  formatInvoiceDueDate,
} from '../utils/invoiceDraft';

export type PublicInvoiceBillLine = {
  id: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
};

export type PublicInvoiceBillModel = {
  businessName: string;
  invoiceNumber: number;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  dueOn: string | null;
  note: string | null;
  totalCents: number;
  lines: PublicInvoiceBillLine[];
  /** Card Pay is available on the public bill. */
  canPay?: boolean;
  /** Public `/b/{code}` when the signed-in shop is viewing a sent bill. */
  shortCode?: string | null;
};

const lineGridClassName =
  'hidden sm:grid sm:grid-cols-[minmax(0,1fr)_3.5rem_7rem_7rem] sm:items-baseline sm:gap-x-4 sm:px-3';

function statusLabel(status: InvoiceStatus): string {
  if (status === 'paid') return 'Paid';
  if (status === 'void') return 'Void';
  return 'Unpaid';
}

function statusClassName(status: InvoiceStatus): string {
  if (status === 'paid') return 'bg-[#e7f6ec] text-[#1d6b3a]';
  if (status === 'void') return 'bg-[#f1efeb] text-[#6f6a64]';
  return 'bg-[#f4f0e6] text-[#6b5420]';
}

export const PublicInvoiceBill: React.FC<{
  invoice: PublicInvoiceBillModel;
  /** Inside the dashboard. The public page keeps the full-screen sheet. */
  embedded?: boolean;
  /** Public short code used to start card checkout. */
  shortCode?: string;
}> = ({ invoice, embedded = false, shortCode }) => {
  const phone = invoice.customerPhone
    ? formatUsPhoneDigits(invoice.customerPhone)
    : '';
  const contact = [invoice.customerEmail, phone].filter(Boolean);
  const amountLabel =
    invoice.status === 'paid'
      ? 'Paid'
      : invoice.status === 'void'
        ? 'Void'
        : 'Amount due';
  const note = invoice.note?.trim() ?? '';

  return (
    <main
      className={
        embedded
          ? 'flex flex-1 flex-col bg-[var(--dashboard-bg)] px-3 pt-4 pb-6 text-[#1c1c1c] sm:px-8 sm:pt-5 sm:pb-8'
          : 'flex min-h-dvh flex-col bg-[#f4f3f0] px-3 py-6 text-[#1c1c1c] sm:block sm:min-h-screen sm:px-8 sm:py-12'
      }
    >
      <article
        className={`mx-auto flex w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white px-5 py-8 shadow-[0_18px_50px_rgba(28,24,20,0.12)] sm:rounded-3xl sm:px-12 sm:py-14 ${
          embedded
            ? 'min-h-[min(800px,calc(100dvh-12rem))]'
            : 'my-auto sm:my-0 sm:min-h-[1000px]'
        }`}
      >
        <header>
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8d877f] uppercase">
              Invoice
              <span className="ml-2 font-medium tracking-normal tabular-nums">
                #{invoice.invoiceNumber}
              </span>
            </p>
            <p
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName(invoice.status)}`}
            >
              {statusLabel(invoice.status)}
            </p>
          </div>
          <h1 className="mt-2 min-w-0 text-[1.65rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
            {invoice.businessName}
          </h1>
        </header>

        <div className="mt-8 grid gap-6 border-t border-[#eceae4] pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#8d877f] uppercase">
              Billed to
            </p>
            <p className="mt-2 text-base font-semibold">
              {invoice.customerName.trim() || '—'}
            </p>
            {contact.map(line => (
              <p key={line} className="mt-0.5 text-sm leading-6 text-[#5c5854]">
                {line}
              </p>
            ))}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium tracking-wide text-[#8d877f] uppercase">
              Due date
            </p>
            <p className="mt-2 text-base font-semibold">
              {formatInvoiceDueDate(invoice.dueOn ?? '')}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div
            className={`${lineGridClassName} rounded-lg bg-[#f4f3f0] py-2.5 text-xs font-medium tracking-wide text-[#8d877f] uppercase`}
          >
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Amount</span>
          </div>
          <ul className="flex list-none flex-col">
            {invoice.lines.map(line => (
              <li
                key={line.id}
                className="border-b border-[#f0eee9] py-4 text-sm sm:py-3.5"
              >
                <div className="flex items-start justify-between gap-4 sm:hidden">
                  <div className="min-w-0">
                    <p className="font-medium break-words">
                      {line.description.trim() || 'Item'}
                    </p>
                    <p className="mt-1 text-[#6f6a64]">
                      {line.quantity} ×{' '}
                      {formatInvoiceCents(line.unitAmountCents)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatInvoiceCents(line.amountCents)}
                  </p>
                </div>
                <div className={lineGridClassName}>
                  <span className="min-w-0 break-words">
                    {line.description.trim() || 'Item'}
                  </span>
                  <span className="text-right tabular-nums text-[#5c5854]">
                    {line.quantity}
                  </span>
                  <span className="text-right tabular-nums text-[#5c5854]">
                    {formatInvoiceCents(line.unitAmountCents)}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {formatInvoiceCents(line.amountCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-6 flex w-full flex-col gap-2 text-sm sm:ml-auto sm:max-w-xs sm:pr-3">
          <div className="flex items-center justify-between gap-6 text-[#6f6a64]">
            <dt>Subtotal</dt>
            <dd className="tabular-nums text-[#1c1c1c]">
              {formatInvoiceCents(invoice.totalCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-[#eceae4] pt-3 font-semibold">
            <dt>{amountLabel}</dt>
            <dd className="tabular-nums">
              {formatInvoiceCents(invoice.totalCents)}
            </dd>
          </div>
        </dl>

        {invoice.canPay && shortCode ? (
          <InvoicePayButton
            shortCode={shortCode}
            amountLabel={formatInvoiceCents(invoice.totalCents)}
          />
        ) : null}

        {note ? (
          <div className="mt-10 border-t border-[#eceae4] pt-6">
            <p className="text-xs font-medium tracking-wide text-[#8d877f] uppercase">
              Notes
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#3f3c38]">
              {note}
            </p>
          </div>
        ) : null}
      </article>
    </main>
  );
};
