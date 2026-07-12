/**
 * HTML for availability booking emails — owner notification and customer confirmation (V2).
 */

import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import { formatDurationForEmail } from '../utils/formatDurationForEmail';
import {
  serviceLinkEmailCta,
  serviceLinkEmailDetailRow,
  serviceLinkEmailFootnote,
  serviceLinkEmailSection,
  serviceLinkEmailServiceAndPricingContent,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { AvailabilityBookingNotificationPayload } from './types';

export type AvailabilityBookingEmailOptions =
  | { audience: 'owner'; dashboardBookingsUrl: string }
  | { audience: 'customer'; businessName: string };

function formatTimeHHmm(hhmm: string): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

/** Format YYYY-MM-DD as "February 26, 2026". */
function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function paymentSummaryFootnoteHtml(
  block: NonNullable<AvailabilityBookingNotificationPayload['paymentSummary']>,
  options: AvailabilityBookingEmailOptions
): string {
  if (block.stripeCardPayment) {
    if (options.audience === 'owner') {
      const text =
        'The customer paid by card through ServiceLink. They may receive a receipt from Stripe—that email is for this payment only, not a duplicate charge. Collect any remaining balance according to your agreement with the customer.';
      return serviceLinkEmailFootnote(text);
    }
    return '';
  }
  if (block.note?.trim()) {
    return serviceLinkEmailFootnote(block.note.trim());
  }
  return '';
}

function buildPaymentSummarySection(
  payload: AvailabilityBookingNotificationPayload,
  options: AvailabilityBookingEmailOptions,
  addSection: (title: string, rowsHtml: string) => void
): string {
  const block = payload.paymentSummary;
  if (!block?.rows?.length) return '';
  const title = (block.title ?? 'Payment').trim();
  const rows = block.rows.map((r, i) =>
    serviceLinkEmailDetailRow(r.label, r.value, {
      isLast:
        i === block.rows.length - 1 &&
        !paymentSummaryFootnoteHtml(block, options),
    })
  );
  addSection(title, rows.join(''));
  return paymentSummaryFootnoteHtml(block, options);
}

function formatVehicleLine(
  payload: AvailabilityBookingNotificationPayload
): string | null {
  const parts = [
    payload.customerVehicleYear?.trim(),
    payload.customerVehicleMake?.trim(),
    payload.customerVehicleModel?.trim(),
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return parts.join(' ');
}

function buildLocationSection(
  payload: AvailabilityBookingNotificationPayload,
  options: AvailabilityBookingEmailOptions,
  addSection: (title: string, rowsHtml: string) => void
): void {
  const loc = payload.serviceLocation;
  if (!loc?.formattedAddress) return;

  if (options.audience === 'owner') {
    if (loc.type === 'mobile') {
      addSection(
        'Service address',
        serviceLinkEmailDetailRow('Address', loc.formattedAddress, {
          isLast: true,
        })
      );
      return;
    }
    addSection(
      'Service location',
      [
        serviceLinkEmailDetailRow('Type', 'Shop visit'),
        serviceLinkEmailDetailRow('Your shop', loc.formattedAddress, {
          isLast: true,
        }),
      ].join('')
    );
    return;
  }

  if (loc.type === 'shop') {
    addSection(
      'Visit us at',
      serviceLinkEmailDetailRow('Shop address', loc.formattedAddress, {
        isLast: true,
      })
    );
    return;
  }

  addSection(
    'Service address',
    serviceLinkEmailDetailRow('Address', loc.formattedAddress, { isLast: true })
  );
}

function buildDetailRows(
  rows: Array<{ label: string; value: string }>
): string {
  return rows
    .map((row, i) =>
      serviceLinkEmailDetailRow(row.label, row.value, {
        isLast: i === rows.length - 1,
      })
    )
    .join('');
}

export function buildAvailabilityBookingEmailHtml(
  payload: AvailabilityBookingNotificationPayload,
  options: AvailabilityBookingEmailOptions
): string {
  const timeLabel = formatTimeHHmm(payload.startTime);
  const dateLabel = formatDateLong(payload.scheduledDate);
  const durationLabel = formatDurationForEmail(payload.durationMinutes);

  const vehicleLine = formatVehicleLine(payload);
  const addOns = payload.selectedAddOns ?? [];
  const optionLabel = payload.servicePriceOptionLabel?.trim();

  const hasBasePrice =
    payload.servicePriceCents != null && payload.servicePriceCents > 0;
  const basePriceLabel = hasBasePrice
    ? formatPriceCents(payload.servicePriceCents!)
    : null;

  const totalLabel =
    payload.discount != null && payload.discount.estimatedTotalCents >= 0
      ? formatPriceCents(payload.discount.estimatedTotalCents)
      : payload.totalPriceCents != null && payload.totalPriceCents > 0
        ? formatPriceCents(payload.totalPriceCents)
        : null;

  const discountForEmail =
    payload.discount != null && payload.discount.discountCents > 0
      ? {
          label: payload.discount.label,
          amountLabel: `−${formatPriceCents(payload.discount.discountCents)}`,
        }
      : null;

  const serviceLineItems: Array<{
    label: string;
    price: string;
    isAddOn?: boolean;
  }> = [];
  if (hasBasePrice && basePriceLabel) {
    serviceLineItems.push({
      label: payload.serviceName,
      price: basePriceLabel,
    });
  }
  for (const addOn of addOns) {
    serviceLineItems.push({
      label: addOn.name,
      price: formatPriceCents(addOn.priceCents),
      isAddOn: true,
    });
  }

  const showServiceSection =
    Boolean(payload.serviceName?.trim()) ||
    serviceLineItems.length > 0 ||
    addOns.length > 0;

  const phoneRow = payload.customerPhone?.trim()
    ? {
        label: 'Phone',
        value: formatPhoneUsDisplay(payload.customerPhone.trim()),
      }
    : null;

  const appointmentRows: Array<{ label: string; value: string }> = [];
  if (options.audience === 'customer') {
    appointmentRows.push({
      label: 'Business',
      value: options.businessName,
    });
  }
  appointmentRows.push(
    { label: 'Date', value: dateLabel },
    {
      label: 'Time',
      value: `${timeLabel} (${durationLabel})`,
    }
  );

  const customerInfoRows: Array<{ label: string; value: string }> = [
    { label: 'Name', value: payload.customerName },
    { label: 'Email', value: payload.customerEmail },
  ];
  if (phoneRow) customerInfoRows.push(phoneRow);
  if (vehicleLine)
    customerInfoRows.push({ label: 'Vehicle', value: vehicleLine });

  const ownerCustomerRows: Array<{ label: string; value: string }> = [
    { label: 'Name', value: payload.customerName },
    { label: 'Email', value: payload.customerEmail },
  ];
  if (phoneRow) ownerCustomerRows.push(phoneRow);
  if (vehicleLine)
    ownerCustomerRows.push({ label: 'Vehicle', value: vehicleLine });
  ownerCustomerRows.push(
    { label: 'Date', value: dateLabel },
    { label: 'Time', value: `${timeLabel} (${durationLabel})` }
  );

  const sectionHtmlParts: string[] = [];
  let sectionCount = 0;
  const addSection = (title: string, rowsHtml: string) => {
    sectionHtmlParts.push(
      serviceLinkEmailSection(title, rowsHtml, {
        isFirst: sectionCount === 0,
      })
    );
    sectionCount += 1;
  };

  if (options.audience === 'owner') {
    addSection('Customer info', buildDetailRows(ownerCustomerRows));
  } else {
    addSection('Your appointment', buildDetailRows(appointmentRows));
    addSection('Your information', buildDetailRows(customerInfoRows));
  }

  buildLocationSection(payload, options, addSection);

  if (showServiceSection) {
    addSection(
      'Service details',
      serviceLinkEmailServiceAndPricingContent({
        serviceName: payload.serviceName,
        optionLabel: optionLabel || undefined,
        lineItems: serviceLineItems,
        totalLabel: serviceLineItems.length > 0 ? totalLabel : null,
        discount: serviceLineItems.length > 0 ? discountForEmail : null,
      })
    );
  }

  const paymentFootnote = buildPaymentSummarySection(
    payload,
    options,
    addSection
  );

  const ctaHtml =
    options.audience === 'owner'
      ? serviceLinkEmailCta(options.dashboardBookingsUrl, 'View in dashboard')
      : '';

  const sectionsHtml = [...sectionHtmlParts, paymentFootnote, ctaHtml]
    .filter(Boolean)
    .join('');

  const heading =
    options.audience === 'owner'
      ? 'New appointment'
      : 'Your appointment is confirmed';

  const subtitle =
    options.audience === 'owner'
      ? 'You have a new appointment. Here are the details:'
      : `Here are the details for your visit with ${options.businessName}:`;

  const footerHtml =
    options.audience === 'owner'
      ? `This email was sent because someone booked an appointment with your business.<br>&copy; ${new Date().getFullYear()} ServiceLink.`
      : `You received this email because an appointment was scheduled using this address.<br>&copy; ${new Date().getFullYear()} ServiceLink.`;

  return wrapServiceLinkEmail({
    title: 'Appointment',
    heading,
    subtitle,
    bodyHtml: sectionsHtml,
    footerHtml,
  });
}

export function getAvailabilityBookingNotificationSubject(
  customerName: string
): string {
  return `New appointment from ${customerName}`;
}

export function getAvailabilityBookingCustomerSubject(
  businessName: string
): string {
  return `Your appointment with ${businessName}`;
}
