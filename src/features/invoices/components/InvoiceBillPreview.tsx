'use client';

import { formatUsPhoneDigits } from '@/components/shared';
import React from 'react';

import type { InvoiceDraft } from '../types';
import {
  formatInvoiceCents,
  formatInvoiceDueDate,
  invoiceDraftTotalCents,
  invoiceLineTotalCents,
  parseInvoiceAmountToCents,
  parseInvoiceQuantity,
} from '../utils/invoiceDraft';

interface InvoiceBillPreviewProps {
  businessName: string;
  draft: InvoiceDraft;
}

const lineGridClassName =
  'grid grid-cols-[minmax(0,1fr)_2.25rem_5.25rem_5.25rem] items-baseline gap-x-3';

export const InvoiceBillPreview: React.FC<InvoiceBillPreviewProps> = ({
  businessName,
  draft,
}) => {
  const customerName = draft.customerName.trim();
  const phone = formatUsPhoneDigits(draft.customerPhone);
  const email = draft.customerEmail.trim();
  const note = draft.note.trim();
  const contact = [email, phone].filter(Boolean);
  const visibleLines = draft.lines.filter(
    line => line.description.trim() || line.amount.trim()
  );
  const totalCents = invoiceDraftTotalCents(draft.lines);

  return (
    <section
      aria-label="Invoice preview"
      className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5"
    >
      <h2 className="mb-4 shrink-0 px-1 text-base font-semibold text-white">
        Preview
      </h2>
      <article className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white text-[#1c1c1c] shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <p className="min-w-0 text-[15px] font-semibold leading-snug">
            {businessName}
          </p>
          <p className="shrink-0 text-[13px] font-medium tracking-wide text-[#3a3a3a]">
            Draft
          </p>
        </div>

        <div className="mx-6 border-t border-[#eceae4]" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-4">
          <div>
            <p className="text-[11px] text-[#8d877f]">Due date</p>
            <p className="mt-1 text-[13px] font-semibold">
              {formatInvoiceDueDate(draft.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#8d877f]">Currency</p>
            <p className="mt-1 text-[13px] font-semibold">USD</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8d877f]">Billed to</p>
            <p className="mt-1 text-[13px] font-semibold">
              {customerName || '—'}
            </p>
            {contact.map(line => (
              <p key={line} className="text-[12px] leading-5 text-[#6f6a64]">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div
            className={`${lineGridClassName} rounded-md bg-[#f4f3f0] px-3 py-2 text-[10px] font-medium tracking-wide text-[#8d877f] uppercase`}
          >
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Amount</span>
          </div>

          {visibleLines.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-[#b0aaa4]">
              Line items show up here.
            </p>
          ) : (
            <ul className="mt-1 flex list-none flex-col">
              {visibleLines.map(line => {
                const lineCents = invoiceLineTotalCents(line);
                const unitCents = parseInvoiceAmountToCents(line.amount);
                const quantity = parseInvoiceQuantity(line.quantity);
                return (
                  <li
                    key={line.id}
                    className={`${lineGridClassName} border-b border-[#f0eee9] px-3 py-2.5 text-[13px]`}
                  >
                    <span className="min-w-0 break-words">
                      {line.description.trim() || 'Item'}
                    </span>
                    <span className="text-right tabular-nums text-[#5c5854]">
                      {quantity ?? '—'}
                    </span>
                    <span className="text-right tabular-nums text-[#5c5854]">
                      {unitCents === null ? '—' : formatInvoiceCents(unitCents)}
                    </span>
                    <span className="text-right font-medium tabular-nums">
                      {lineCents === null ? '—' : formatInvoiceCents(lineCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="mt-4 ml-auto flex w-full max-w-[220px] flex-col gap-1.5 pr-3 text-[13px]">
            <div className="flex items-center justify-between gap-6 text-[#6f6a64]">
              <dt>Subtotal</dt>
              <dd className="tabular-nums text-[#1c1c1c]">
                {formatInvoiceCents(totalCents)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-6 font-semibold">
              <dt>Amount due</dt>
              <dd className="tabular-nums">{formatInvoiceCents(totalCents)}</dd>
            </div>
          </dl>
        </div>

        {note ? (
          <div className="mx-6 border-t border-[#eceae4] py-4">
            <p className="text-[12px] leading-relaxed text-[#6f6a64]">
              <span className="font-medium text-[#3f3c38]">Notes: </span>
              {note}
            </p>
          </div>
        ) : null}
      </article>
    </section>
  );
};
