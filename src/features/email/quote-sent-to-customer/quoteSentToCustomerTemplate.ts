/**
 * Customer-facing quote email. Same dark layout as appointment emails,
 * with a card for each part of the quote.
 */

import { formatQuotePublicLinkExpiryDate } from '@/features/quotes/dashboard/utils/formatQuotePublicLinkExpiry';
import { splitQuoteServiceDisplayName } from '@/features/quotes/shared/quoteServiceSnapshot';
import {
  QUOTE_CARD_MIN_CENTS,
  depositDueCents,
  formatUsdFromCents,
  type QuotePaymentCollection,
} from '@/features/quotes/shared/quotePaymentCollection';
import { escapeHtml } from '../utils/escapeHtml';
import { formatDurationForEmail } from '../utils/formatDurationForEmail';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailPriceLineRow,
  serviceLinkEmailPriceTotalRow,
  serviceLinkEmailSection,
  serviceLinkEmailStatementBlock,
  SERVICE_LINK_EMAIL_FONT,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { QuoteSentToCustomerPayload } from './types';

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeHHmm(hhmm: string): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hhmm.trim();
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

function noteBlock(value: string): string {
  const body = escapeHtml(value.trim()).replace(/\r?\n/g, '<br />');
  return `
    <tr>
      <td colspan="2" style="padding:0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:22px;font-weight:500;color:#fafafa;">
        ${body}
      </td>
    </tr>
  `.trim();
}

export function quoteSentEmailPayment(input: {
  collection: QuotePaymentCollection;
  depositType: 'fixed' | 'percent' | null;
  depositValue: number | null;
  totalCents: number;
}): NonNullable<QuoteSentToCustomerPayload['payment']> {
  const canDeposit =
    input.collection === 'deposit' || input.collection === 'customer_choice';
  if (!canDeposit || !input.depositType || input.depositValue == null) {
    return { collection: input.collection, depositCents: null };
  }
  const due = depositDueCents(
    input.totalCents,
    input.depositType,
    input.depositValue
  );
  return {
    collection: input.collection,
    depositCents: due >= QUOTE_CARD_MIN_CENTS ? due : null,
  };
}

function paymentStatement(payload: QuoteSentToCustomerPayload): {
  heading: string;
  detail: string;
} | null {
  const payment = payload.payment;
  if (!payment) return null;
  const taxCents =
    payload.salesTax && payload.salesTax.taxCents > 0
      ? payload.salesTax.taxCents
      : 0;
  const total = formatUsdFromCents(payload.priceCents + taxCents);
  const deposit =
    payment.depositCents != null && payment.depositCents > 0
      ? formatUsdFromCents(payment.depositCents)
      : null;

  if (payment.collection === 'none') {
    return {
      heading: 'No payment required',
      detail: 'Accept or decline from the quote.',
    };
  }
  if (payment.collection === 'deposit' && deposit) {
    return {
      heading: 'Deposit to book',
      detail: `${deposit} due now. The rest is collected later.`,
    };
  }
  if (payment.collection === 'full') {
    return {
      heading: 'Pay in full to book',
      detail: `${total} due when you accept.`,
    };
  }
  if (payment.collection === 'customer_choice') {
    return {
      heading: 'You choose how to pay',
      detail: deposit
        ? `Pay a ${deposit} deposit, pay ${total} in full, or pay in person.`
        : `Pay ${total} in full, or pay in person.`,
    };
  }
  return null;
}

export function buildQuoteSentToCustomerHtml(
  payload: QuoteSentToCustomerPayload
): string {
  const businessName = payload.businessName.trim() || 'Your detailer';
  const tax =
    payload.salesTax && payload.salesTax.taxCents > 0 ? payload.salesTax : null;
  const addOns = (payload.addonDetails ?? []).filter(addon =>
    addon.name.trim()
  );
  const addonSum = addOns.reduce(
    (sum, addon) => sum + Math.max(0, Math.round(addon.priceCents)),
    0
  );
  const serviceCents = Math.max(0, Math.round(payload.priceCents) - addonSum);
  const serviceName = payload.serviceName.trim();
  const service = serviceName
    ? splitQuoteServiceDisplayName(serviceName)
    : null;
  const totalCents = Math.round(payload.priceCents) + (tax?.taxCents ?? 0);

  const scheduledDate = payload.scheduledDate?.trim() ?? '';
  const scheduledTime = payload.scheduledStartTime?.trim() ?? '';
  const durationLabel = formatDurationForEmail(payload.durationMinutes);
  const showDuration = durationLabel !== '—';

  const serviceRows: string[] = [];
  if (service) {
    serviceRows.push(
      serviceLinkEmailPriceLineRow(
        service.title,
        formatUsdFromCents(serviceCents),
        {
          subLabel: service.optionLabel ?? undefined,
          isLast: addOns.length === 0,
        }
      )
    );
  }
  addOns.forEach((addon, index) => {
    serviceRows.push(
      serviceLinkEmailPriceLineRow(
        addon.name.trim(),
        formatUsdFromCents(addon.priceCents),
        { bullet: true, isLast: index === addOns.length - 1 }
      )
    );
  });

  const details: Array<{ label: string; value: string }> = [];
  if (scheduledDate) {
    details.push({ label: 'Date', value: formatDateLong(scheduledDate) });
  } else if (!scheduledTime) {
    details.push({
      label: 'Date',
      value: "You'll choose when you accept",
    });
  }
  if (scheduledTime) {
    const time = formatTimeHHmm(scheduledTime);
    details.push({
      label: 'Time',
      value: showDuration ? `${time} (${durationLabel})` : time,
    });
  } else if (showDuration && !scheduledDate) {
    details.push({ label: 'Duration', value: durationLabel });
  }
  if (payload.vehicleLine?.trim()) {
    details.push({ label: 'Vehicle', value: payload.vehicleLine.trim() });
  }
  const validUntil = payload.expiresAt?.trim()
    ? formatQuotePublicLinkExpiryDate(payload.expiresAt.trim())
    : '';
  if (validUntil) {
    details.push({ label: 'Valid until', value: validUntil });
  }

  const detailRows = details
    .map((row, index) =>
      serviceLinkEmailDetailRow(row.label, row.value, {
        isLast: index === details.length - 1,
      })
    )
    .join('');

  const totalRows = [
    tax
      ? serviceLinkEmailPriceLineRow(
          'Quote',
          formatUsdFromCents(payload.priceCents)
        )
      : '',
    tax
      ? serviceLinkEmailPriceLineRow(
          tax.label,
          formatUsdFromCents(tax.taxCents)
        )
      : '',
    serviceLinkEmailPriceTotalRow('Total', formatUsdFromCents(totalCents)),
  ].join('');

  const payment = paymentStatement(payload);
  const sectionParts: Array<{ title: string; rowsHtml: string }> = [];
  if (serviceRows.length > 0) {
    sectionParts.push({ title: 'Service', rowsHtml: serviceRows.join('') });
  }
  if (detailRows.trim()) {
    sectionParts.push({ title: 'When', rowsHtml: detailRows });
  }
  if (payload.customerRequestMessage?.trim()) {
    sectionParts.push({
      title: 'Your request',
      rowsHtml: noteBlock(payload.customerRequestMessage),
    });
  }
  if (payload.note?.trim()) {
    sectionParts.push({
      title: 'Notes',
      rowsHtml: noteBlock(payload.note),
    });
  }
  if (payload.priceCents > 0 || tax) {
    sectionParts.push({ title: 'Total', rowsHtml: totalRows });
  }
  if (payment) {
    sectionParts.push({
      title: 'Payment',
      rowsHtml: serviceLinkEmailStatementBlock(payment.heading, payment.detail),
    });
  }

  const sections = [
    ...sectionParts.map((section, index) =>
      serviceLinkEmailSection(section.title, section.rowsHtml, {
        isFirst: index === 0,
      })
    ),
    serviceLinkEmailCta(payload.publicQuoteUrl, 'Review quote', {
      fullWidth: true,
    }),
  ].join('');

  const customerName = payload.customerName.trim();

  return wrapServiceLinkEmail({
    title: `Quote from ${businessName}`,
    heading: 'Your quote is ready',
    subtitle: customerName
      ? `${customerName}, ${businessName} sent you a quote. Review the details and accept or decline.`
      : `${businessName} sent you a quote. Review the details and accept or decline.`,
    bodyHtml: sections,
    footerHtml: `You received this email because a business shared a quote using this address.<br>&copy; ${new Date().getFullYear()} ServiceLink.`,
  });
}

export function getQuoteSentToCustomerSubject(businessName: string): string {
  const name = businessName.trim() || 'Your detailer';
  return `Quote from ${name}`;
}
