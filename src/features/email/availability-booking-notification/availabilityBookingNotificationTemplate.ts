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

  const vehicleLine = formatVehicleLine(payload);
  const addOns = payload.selectedAddOns ?? [];
  const addOnsNames = addOns.map(a => a.name).join(', ');

  const hasBasePrice =
    payload.servicePriceCents != null && payload.servicePriceCents > 0;
  const basePriceLabel = hasBasePrice
    ? formatPriceCents(payload.servicePriceCents!)
    : null;

  const hasAddOnsPrice = addOns.some(
    a => a.priceCents != null && a.priceCents > 0
  );

  const totalLabel =
    payload.totalPriceCents != null && payload.totalPriceCents > 0
      ? formatPriceCents(payload.totalPriceCents)
      : null;

  const addOnsListRows =
    addOns.length > 0
      ? addOns
          .map(
            a => `
                <tr>
                  <td class="detail-label" style="padding: 6px 0; color: #475569;">
                    ${escapeHtml(a.name)}
                  </td>
                  <td class="detail-value" style="padding: 6px 0; color: #0f172a; text-align: right;">
                    ${escapeHtml(formatPriceCents(a.priceCents))}
                  </td>
                </tr>
              `
          )
          .join('')
      : '';

  const addOnsText = addOnsNames || 'None';

  // Pricing rows in the "Estimated Cost Breakdown" card.
  const pricingRows = `
    ${
      hasBasePrice
        ? `
      <tr>
        <td class="detail-label" style="padding: 6px 0; color: #64748b;">
          ${escapeHtml(payload.serviceName)}
        </td>
        <td class="detail-value" style="padding: 6px 0; color: #0f172a; text-align: right;">
          ${escapeHtml(basePriceLabel!)}
        </td>
      </tr>
    `
        : ''
    }
    ${addOnsListRows}
  `.trim();

  const vehicleRowInServiceDetails = vehicleLine
    ? `
      <tr>
        <td class="detail-label" style="padding-bottom: 12px;">Vehicle</td>
        <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(vehicleLine)}</td>
      </tr>
    `
    : '';

  const showPricingCard = Boolean(hasBasePrice) || (addOns?.length ?? 0) > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f9;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f7f9;
      padding-bottom: 40px;
    }

    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      color: #4a4a4a;
    }

    .header { padding: 30px; text-align: center; background-color: #ffffff; }
    .hero { padding: 10px 30px 30px 30px; text-align: center; }
    .content { padding: 0 30px 40px 30px; }

    .card {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 16px;
    }

    .detail-label { font-size: 14px; color: #64748b; }
    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; text-align: right; }

    .button {
      background-color: #2563eb;
      border-radius: 8px;
      color: #ffffff !important;
      display: inline-block;
      font-size: 16px;
      font-weight: 600;
      line-height: 50px;
      text-align: center;
      text-decoration: none;
      width: 100%;
    }

    .footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }

    @media screen and (max-width: 600px) {
      .content { padding: 0 20px 30px 20px; }
      .card { padding: 16px; }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <div style="height: 20px;"></div>
        </td>
      </tr>

      <tr>
        <td class="hero">
          <div style="background-color:#dcfce7;color:#166534;padding:6px 14px;border-radius:20px;display:inline-block;font-size:12px;font-weight:600;margin-bottom:16px;">
            Booking Request Received
          </div>
          <h1 style="font-size:26px;margin:0;color:#1e293b;letter-spacing:-0.02em;">New Appointment</h1>
          <p style="font-size:16px;color:#64748b;margin-top:8px;">You have a new booking, here are the details:</p>
        </td>
      </tr>

      <tr>
        <td class="content">
          <div class="card">
            <div class="section-title">Customer Info</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Name</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.customerName)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Email</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.customerEmail)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Date</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(dateLabel)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Time</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(
                  timeLabel
                )} (${escapeHtml(durationLabel)})</td>
              </tr>
            </table>
          </div>

          <div class="card" style="background-color:#ffffff;">
            <div class="section-title">Service Details</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              ${vehicleRowInServiceDetails}
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Base Service</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.serviceName)}</td>
              </tr>
              ${
                addOns.length > 0
                  ? `<tr>
                      <td class="detail-label" style="padding-bottom: 12px;">Add-ons</td>
                      <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(addOnsText)}</td>
                    </tr>`
                  : ''
              }
            </table>
          </div>

          ${
            showPricingCard
              ? `<div class="card">
                  <div class="section-title">Estimated Cost Breakdown</div>
                  <table width="100%" cellspacing="0" cellpadding="0">
                    ${pricingRows}
                  </table>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 12px; border-top: 1px solid #e2e8f0;">
                    <tr>
                      <td style="font-size: 16px; font-weight: 700; padding-top: 12px; color: #1e293b;">Estimated Total</td>
                      <td style="font-size: 16px; font-weight: 700; padding-top: 12px; text-align: right; color: #2563eb;">
                        ${totalLabel ? escapeHtml(totalLabel) : ''}
                      </td>
                    </tr>
                  </table>
                  <p style="font-size:11px;color:#94a3b8;margin-top:16px;font-style:italic;text-align:center;">
                    Final price to be confirmed upon arrival.
                  </p>
                </div>`
              : ''
          }

          <a href="${escapeHtml(dashboardBookingsUrl)}" class="button">View Booking in Dashboard</a>
        </td>
      </tr>

      <tr>
        <td class="footer">
          This notification was generated automatically following a customer booking.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`.trim();
}

export function getAvailabilityBookingNotificationSubject(
  customerName: string
): string {
  return `New appointment from ${customerName}`;
}
