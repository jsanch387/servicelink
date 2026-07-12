'use client';

import Link from 'next/link';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import {
  formatBusinessProfileLinkLabel,
  type BookingInvoiceSnapshot,
  type InvoiceSnapshotLine,
} from '@/features/availability/booking/server/buildInvoiceSnapshot';
import {
  groupInvoiceSnapshotLines,
  type InvoiceLineGroup,
} from '../../utils/groupInvoiceSnapshotLines';
import { normalizeInvoiceSnapshotLines } from '../../utils/parseStoredBookingServiceName';
import {
  PUBLIC_INVOICE_AMOUNT_COLUMN_CLASS,
  PUBLIC_INVOICE_CONTAINER_CLASS,
  PUBLIC_INVOICE_LINE_ROW_CLASS,
  PUBLIC_INVOICE_SECTION_LABEL_CLASS,
  PUBLIC_INVOICE_TEXT_WRAP_CLASS,
} from '../constants/publicInvoiceLayout';

const PAGE_X =
  'px-[max(1rem,env(safe-area-inset-left))] sm:px-6 [padding-right:max(1rem,env(safe-area-inset-right))]';
const PAGE_Y =
  'pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:pt-10 sm:pb-12';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatVisitShort(scheduledDate: string, startTime: string): string {
  const d = new Date(`${scheduledDate}T12:00:00`);
  const dateLabel = Number.isNaN(d.getTime())
    ? scheduledDate
    : d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const trimmed = startTime.trim().slice(0, 5);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return dateLabel;

  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${dateLabel} at ${h12}:${min} ${ampm}`;
}

function formatPaymentMethod(method: string): string {
  return method.replace(/_/g, ' ');
}

function BusinessInvoiceMark() {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e0ddd6] bg-[#f7f5f0] dark:border-[#333] dark:bg-[#222]"
      aria-hidden
    >
      <BuildingStorefrontIcon className="h-5 w-5 text-[#888480] dark:text-[#888]" />
    </span>
  );
}

function ChargeAmount({
  amountCents,
  size = 'md',
  tone = 'default',
}: {
  amountCents: number;
  size?: 'md' | 'sm';
  tone?: 'default' | 'discount';
}) {
  const isDiscount = tone === 'discount';
  return (
    <p
      className={`${PUBLIC_INVOICE_AMOUNT_COLUMN_CLASS} tabular-nums font-medium ${
        isDiscount
          ? 'text-[#15803d] dark:text-[#86efac]'
          : 'text-[#1a1a1a] dark:text-[#f0f0f0]'
      } ${size === 'sm' ? 'text-[14px]' : 'text-[15px]'}`}
    >
      {isDiscount ? `−${formatCents(amountCents)}` : formatCents(amountCents)}
    </p>
  );
}

function InvoiceLineRow({
  primary,
  secondary,
  amountCents,
  amountSize = 'md',
  primaryClassName = 'text-[15px] font-medium text-[#1a1a1a] dark:text-[#f0f0f0]',
  secondaryClassName = 'mt-0.5 text-[13px] font-normal text-[#888480] dark:text-[#aaa]',
}: {
  primary: string;
  secondary?: string | null;
  amountCents: number;
  amountSize?: 'md' | 'sm';
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  return (
    <div className={PUBLIC_INVOICE_LINE_ROW_CLASS}>
      <div className={`flex-1 ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}>
        <p className={`leading-snug ${primaryClassName}`}>{primary}</p>
        {secondary ? (
          <p className={`leading-snug ${secondaryClassName}`}>{secondary}</p>
        ) : null}
      </div>
      <ChargeAmount amountCents={amountCents} size={amountSize} />
    </div>
  );
}

function VisitSummary({
  customerName,
  serviceName,
  servicePriceOptionLabel,
  visitShort,
}: {
  customerName: string;
  serviceName: string;
  servicePriceOptionLabel: string | null;
  visitShort: string;
}) {
  return (
    <div className="mx-5 mb-6 rounded-xl bg-[#f7f5f0] px-4 py-3.5 sm:mx-6 md:mx-8 dark:bg-[#222]">
      <p
        className={`text-[14px] font-medium leading-snug text-[#1a1a1a] dark:text-[#eee] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
      >
        {customerName}
      </p>
      <p
        className={`mt-2 text-[13px] font-medium leading-snug text-[#555250] dark:text-[#bbb] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
      >
        {serviceName}
      </p>
      {servicePriceOptionLabel ? (
        <p
          className={`mt-0.5 text-[13px] leading-snug text-[#888480] dark:text-[#aaa] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
        >
          {servicePriceOptionLabel}
        </p>
      ) : null}
      <p
        className={`mt-2 text-[13px] leading-snug text-[#888480] dark:text-[#aaa] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
      >
        {visitShort}
      </p>
    </div>
  );
}

function GroupedChargeRow({ line }: { line: InvoiceSnapshotLine }) {
  return (
    <div
      className={`${PUBLIC_INVOICE_LINE_ROW_CLASS} py-2.5 first:pt-3 last:pb-3`}
    >
      <p
        className={`flex-1 leading-snug text-[14px] text-[#555250] dark:text-[#bbb] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
      >
        {line.label}
      </p>
      <ChargeAmount amountCents={line.amountCents} size="sm" />
    </div>
  );
}

function ServiceChargeRow({ line }: { line: InvoiceSnapshotLine }) {
  return (
    <InvoiceLineRow
      primary={line.label}
      secondary={line.detailLabel?.trim() || null}
      amountCents={line.amountCents}
    />
  );
}

function DiscountChargeRow({ line }: { line: InvoiceSnapshotLine }) {
  return (
    <div className={PUBLIC_INVOICE_LINE_ROW_CLASS}>
      <div className={`flex-1 ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}>
        <p className="leading-snug text-[15px] font-medium text-[#15803d] dark:text-[#86efac]">
          {line.label}
        </p>
      </div>
      <ChargeAmount amountCents={line.amountCents} tone="discount" />
    </div>
  );
}

function ChargeGroupSection({ group }: { group: InvoiceLineGroup }) {
  const isService = group.id === 'service';
  const isDiscount = group.id === 'discount';
  const isMulti = group.lines.length > 1;

  if (isService) {
    return (
      <div className="space-y-4">
        {group.lines.map((line, index) => (
          <ServiceChargeRow
            key={`service-${line.label}-${line.detailLabel ?? ''}-${index}`}
            line={line}
          />
        ))}
      </div>
    );
  }

  if (isDiscount) {
    return (
      <div className="space-y-3">
        {group.lines.map((line, index) => (
          <DiscountChargeRow
            key={`discount-${line.label}-${index}`}
            line={line}
          />
        ))}
      </div>
    );
  }

  if (isMulti) {
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p
            className={`min-w-[50%] flex-1 leading-snug ${PUBLIC_INVOICE_SECTION_LABEL_CLASS} ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
          >
            {group.title}
            <span className="font-normal text-[#c4c0b8] dark:text-[#666]">
              {' '}
              · {group.lines.length} items
            </span>
          </p>
          <p
            className={`${PUBLIC_INVOICE_AMOUNT_COLUMN_CLASS} text-[13px] tabular-nums font-medium text-[#888480]`}
          >
            {formatCents(group.subtotalCents)}
          </p>
        </div>
        <div className="rounded-xl border border-[#ebe8e1] bg-[#faf9f7] px-3.5 dark:border-[#2a2a2a] dark:bg-[#222]">
          <div className="divide-y divide-[#ebe8e1] dark:divide-[#333]">
            {group.lines.map((line, index) => (
              <GroupedChargeRow
                key={`${group.id}-${line.label}-${index}`}
                line={line}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const line = group.lines[0];
  if (!line) return null;

  return (
    <div>
      <p
        className={`mb-1.5 leading-snug ${PUBLIC_INVOICE_SECTION_LABEL_CLASS} ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
      >
        {group.title}
      </p>
      <InvoiceLineRow
        primary={line.label}
        amountCents={line.amountCents}
        amountSize="sm"
        primaryClassName="text-[14px] font-normal text-[#555250] dark:text-[#bbb]"
      />
    </div>
  );
}

function PaymentRow({
  label,
  method,
  amountCents,
}: {
  label: string;
  method?: string;
  amountCents: number;
}) {
  return (
    <div className={`${PUBLIC_INVOICE_LINE_ROW_CLASS} py-3.5`}>
      <div className={`flex-1 ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}>
        <p className="leading-snug text-[14px] text-[#555250] dark:text-[#bbb]">
          {label}
        </p>
        {method ? (
          <p className="mt-0.5 leading-snug text-[12px] capitalize text-[#aaa8a4]">
            {formatPaymentMethod(method)}
          </p>
        ) : null}
      </div>
      <ChargeAmount amountCents={amountCents} size="sm" />
    </div>
  );
}

export function PublicInvoicePageShell({
  snapshot,
}: {
  snapshot: BookingInvoiceSnapshot;
}) {
  const visitShort = formatVisitShort(
    snapshot.booking.scheduledDate,
    snapshot.booking.startTime
  );
  const isPaidInFull =
    snapshot.totals.paidCents >= snapshot.totals.totalCents &&
    snapshot.totals.totalCents > 0;
  const chargeGroups = groupInvoiceSnapshotLines(
    normalizeInvoiceSnapshotLines(snapshot.lines)
  );
  const servicePriceOptionLabel =
    snapshot.booking.servicePriceOptionLabel?.trim() || null;

  const ctaClassName =
    'touch-manipulation mt-6 flex w-full min-h-[52px] items-center justify-center rounded-xl bg-[#0f0f0f] px-5 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] hover:bg-[#2a2a2a] dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-[#e8e6e1]';

  return (
    <main className="min-h-[100dvh] bg-[#f2f0eb] antialiased dark:bg-[#0f0f0f]">
      <div className={`${PUBLIC_INVOICE_CONTAINER_CLASS} ${PAGE_X} ${PAGE_Y}`}>
        <article className="overflow-hidden rounded-2xl border border-[#e0ddd6] bg-white shadow-[0_2px_8px_rgba(15,15,15,0.06)] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:shadow-none">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-[#ebe8e1] px-5 py-5 sm:px-6 md:px-8 dark:border-[#2a2a2a]">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <BusinessInvoiceMark />
              <div
                className={`min-w-0 flex-1 ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
              >
                <p className="text-[15px] font-semibold leading-snug text-[#0f0f0f] dark:text-white">
                  {snapshot.business.name}
                </p>
                <p className="mt-0.5 text-[13px] text-[#888480]">Receipt</p>
              </div>
            </div>
            {isPaidInFull ? (
              <span className="shrink-0 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-semibold text-[#15803d] dark:bg-[#14532d]/40 dark:text-[#86efac]">
                Paid
              </span>
            ) : null}
          </div>

          {/* Total hero */}
          <div className="px-5 py-6 sm:px-6 md:px-8">
            <p className="text-[13px] font-medium text-[#888480]">
              {isPaidInFull ? 'Amount paid' : 'Amount due'}
            </p>
            <p className="mt-1 text-[clamp(1.75rem,8vw,2.25rem)] font-semibold leading-none tracking-[-0.03em] text-[#0f0f0f] dark:text-white">
              {formatCents(snapshot.totals.totalCents)}
            </p>
          </div>

          <VisitSummary
            customerName={snapshot.customer.name}
            serviceName={snapshot.booking.serviceName}
            servicePriceOptionLabel={servicePriceOptionLabel}
            visitShort={visitShort}
          />

          {/* Line items slip */}
          <div className="border-t border-[#ebe8e1] px-5 py-1 sm:px-6 md:px-8 dark:border-[#2a2a2a]">
            <p className={`py-3 ${PUBLIC_INVOICE_SECTION_LABEL_CLASS}`}>
              Charges
            </p>
            <div className="space-y-5 pb-1">
              {chargeGroups.map(group => (
                <ChargeGroupSection key={group.id} group={group} />
              ))}
            </div>
          </div>

          {/* Payments */}
          {snapshot.payments.length > 0 ? (
            <div className="border-t border-[#ebe8e1] px-5 py-1 sm:px-6 md:px-8 dark:border-[#2a2a2a]">
              <p className={`py-3 ${PUBLIC_INVOICE_SECTION_LABEL_CLASS}`}>
                Payment
              </p>
              <div className="divide-y divide-[#ebe8e1] dark:divide-[#2a2a2a]">
                {snapshot.payments.map((payment, index) => (
                  <PaymentRow
                    key={`${payment.kind}-${index}`}
                    label={payment.label}
                    method={payment.method}
                    amountCents={payment.amountCents}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Review CTA */}
          {snapshot.reviewUrl ? (
            <div className="border-t border-[#ebe8e1] px-5 pb-6 pt-2 sm:px-6 md:px-8 dark:border-[#2a2a2a]">
              <Link href={snapshot.reviewUrl} className={ctaClassName}>
                Leave a review
              </Link>
              <p
                className={`mt-2.5 text-center text-[12px] leading-relaxed text-[#aaa8a4] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
              >
                Share your experience with {snapshot.business.name}
              </p>
            </div>
          ) : (
            <div className="h-5" />
          )}
        </article>

        <footer
          className={`mt-5 px-1 text-center text-[12px] leading-relaxed text-[#aaa8a4] ${PUBLIC_INVOICE_TEXT_WRAP_CLASS}`}
        >
          <p>Questions? Contact {snapshot.business.name} directly.</p>
          {snapshot.business.profileUrl ? (
            <a
              href={snapshot.business.profileUrl}
              className="mt-1 inline-block py-1 text-[#888480] underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatBusinessProfileLinkLabel(snapshot.business.profileUrl)}
            </a>
          ) : null}
        </footer>
      </div>
    </main>
  );
}
