/**
 * HTML template for the "new availability booking" email sent to the business owner (V2).
 */

import { escapeHtml } from '../utils/escapeHtml';
import type { AvailabilityBookingNotificationPayload } from './types';

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

/** Format duration in minutes as hours (whole hours only), e.g. 60 → "1 hr", 120 → "2 hrs". */
function formatDurationHours(minutes: number): string {
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hr' : `${hours} hrs`;
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildAddOnsRows(
  addons: { name: string; priceCents: number }[]
): string {
  if (!addons?.length) return '';
  return addons
    .map(
      a =>
        `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">+ ${escapeHtml(a.name)}</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(formatPriceCents(a.priceCents))}</td></tr>`
    )
    .join('');
}

export function buildAvailabilityBookingNotificationHtml(
  payload: AvailabilityBookingNotificationPayload,
  dashboardBookingsUrl: string
): string {
  const timeLabel = formatTimeHHmm(payload.startTime);
  const dateLabel = formatDateLong(payload.scheduledDate);
  const durationLabel = formatDurationHours(payload.durationMinutes);
  const hasBasePrice =
    payload.servicePriceCents != null && payload.servicePriceCents > 0;
  const addOns = payload.selectedAddOns ?? [];
  const addOnsRows = buildAddOnsRows(addOns);
  const hasTotalPrice =
    payload.totalPriceCents != null &&
    payload.totalPriceCents > 0 &&
    (hasBasePrice || addOns.length > 0);
  const priceRow = hasBasePrice
    ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service price</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(formatPriceCents(payload.servicePriceCents!))}</td></tr>`
    : '';
  const totalRow =
    hasTotalPrice && addOns.length > 0
      ? `<tr><td style="padding: 8px 0;"><strong>Total</strong></td><td style="padding: 8px 0;"><strong>${escapeHtml(formatPriceCents(payload.totalPriceCents!))}</strong></td></tr>`
      : hasBasePrice
        ? `<tr><td style="padding: 8px 0;"><strong>Price</strong></td><td style="padding: 8px 0;">${escapeHtml(formatPriceCents(payload.servicePriceCents!))}</td></tr>`
        : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New appointment from ${escapeHtml(payload.customerName)}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0;">New appointment</h2>
  <p>You have a new booking. Here are the details:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Customer</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.customerName)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.customerEmail)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.serviceName)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(dateLabel)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(timeLabel)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Duration</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(durationLabel)}</td></tr>
    ${priceRow}
    ${addOnsRows}
    ${totalRow}
  </table>
  <p>
    <a href="${escapeHtml(dashboardBookingsUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px;">View booking in dashboard</a>
  </p>
  <p style="color: #666; font-size: 14px;">This email was sent because a customer booked an appointment through your availability page.</p>
</body>
</html>
`.trim();
}

export function getAvailabilityBookingNotificationSubject(
  customerName: string
): string {
  return `New appointment from ${customerName}`;
}
