/**
 * Customer-facing quote email — layout matches availability booking
 * `buildAvailabilityBookingEmailHtml` (customer): wrapper, cards, full-width CTA.
 */

import { escapeHtml } from '../utils/escapeHtml';
import type { QuoteSentToCustomerPayload } from './types';

function formatPriceWholeDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Match availability booking email time formatting. */
function formatTimeHHmm(hhmm: string): string {
  const trimmed = hhmm.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

/** Same idea as availability template: whole hours for the parenthetical. */
function formatDurationHours(minutes: number): string {
  if (minutes <= 0) return '';
  const hours = Math.round(minutes / 60);
  if (hours < 1) return `${minutes} min`;
  return hours === 1 ? '1 hr' : `${hours} hrs`;
}

export function buildQuoteSentToCustomerHtml(
  payload: QuoteSentToCustomerPayload
): string {
  const businessName = escapeHtml(payload.businessName);
  const priceLabel = formatPriceWholeDollars(payload.priceCents);
  const hasSchedule = Boolean(
    payload.scheduledDate?.trim() && payload.scheduledStartTime?.trim()
  );
  const dateLabel = hasSchedule
    ? formatDateLong(payload.scheduledDate!.trim())
    : "You'll choose when you accept";
  const durationPart = formatDurationHours(payload.durationMinutes);
  const timeAndDuration = hasSchedule
    ? durationPart.trim().length > 0
      ? `${escapeHtml(formatTimeHHmm(payload.scheduledStartTime!.trim()))} <span style="color:#94a3b8;">·</span> ${escapeHtml(durationPart)}`
      : escapeHtml(formatTimeHHmm(payload.scheduledStartTime!.trim()))
    : durationPart.trim().length > 0
      ? escapeHtml(durationPart)
      : '—';

  const vehicleRow = payload.vehicleLine?.trim()
    ? `
      <tr>
        <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top; width: 42%;">Vehicle</td>
        <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(payload.vehicleLine.trim())}</td>
      </tr>`
    : '';

  const addonRows = (payload.addonDetails ?? [])
    .filter(a => a.name.trim())
    .map(
      a => `
              <tr>
                <td class="detail-label" style="padding: 0 16px 8px 0; vertical-align: top; width: 42%;">Add-on</td>
                <td class="detail-value" style="padding: 0 0 8px 0; vertical-align: top;">${escapeHtml(a.name.trim())} <span style="color:#94a3b8;">(+${escapeHtml(formatPriceWholeDollars(a.priceCents))})</span></td>
              </tr>`
    )
    .join('');

  const customerRequestBlock = payload.customerRequestMessage?.trim()
    ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <div class="section-title">Customer note</div>
            <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(payload.customerRequestMessage.trim())}</p>
          </div>`
    : '';

  const ownerMessageBlock = payload.note?.trim()
    ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <div class="section-title">Notes from the business</div>
            <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(payload.note.trim())}</p>
          </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote from ${businessName}</title>
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
    .detail-label {
      font-size: 14px;
      color: #64748b;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
      text-align: right;
    }
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
    <table class="main" role="presentation">
      <tr>
        <td class="header">
          <div style="height: 20px;"></div>
        </td>
      </tr>
      <tr>
        <td class="hero">
          <h1 style="font-size: 26px; margin: 0; color: #1e293b; letter-spacing: -0.02em;">Your quote is ready</h1>
          <p style="font-size: 16px; color: #1e293b; margin-top: 12px; font-weight: 600;">Hi ${escapeHtml(payload.customerName)},</p>
          <p style="font-size: 16px; color: #64748b; margin-top: 8px; line-height: 1.5;">
            ${businessName} sent you a quote. Tap the button below to review the full details and accept or decline.
          </p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="card">
            <div class="section-title">Quote summary</div>
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top; width: 42%;">Business</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${businessName}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top;">Date</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(dateLabel)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding: 0 16px 0 0; vertical-align: top;">Time</td>
                <td class="detail-value" style="padding: 0; vertical-align: top;">${timeAndDuration}</td>
              </tr>
            </table>
          </div>

          <div class="card" style="background-color: #ffffff;">
            <div class="section-title">Service &amp; pricing</div>
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top; width: 42%;">Service</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(payload.serviceName)}</td>
              </tr>
              ${addonRows}
              ${vehicleRow}
              <tr>
                <td class="detail-label" style="padding: 0 16px 0 0; vertical-align: top;">Total</td>
                <td class="detail-value" style="padding: 0; vertical-align: top; color: #2563eb; font-weight: 700;">${escapeHtml(priceLabel)}</td>
              </tr>
            </table>
            ${customerRequestBlock}
            ${ownerMessageBlock}
          </div>

          <p style="margin: 0 0 8px 0;">
            <a href="${escapeHtml(payload.publicQuoteUrl)}" class="button" target="_blank" rel="noopener noreferrer">Review quote</a>
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          You received this email because a business shared a quote using this address.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`.trim();
}

export function getQuoteSentToCustomerSubject(businessName: string): string {
  const name = businessName.trim() || 'Your detailer';
  return `Quote from ${name}`;
}
