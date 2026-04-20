/**
 * HTML for availability booking emails — owner notification and customer confirmation (V2).
 */

import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import { escapeHtml } from '../utils/escapeHtml';
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

/** Format duration in minutes as hours (whole hours only), e.g. 60 → "1 hr", 120 → "2 hrs". */
function formatDurationHours(minutes: number): string {
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hr' : `${hours} hrs`;
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
      return `<p style="font-size:13px;color:#64748b;margin-top:14px;line-height:1.55;">${escapeHtml(text)}</p>`;
    }
    const provider =
      options.audience === 'customer'
        ? options.businessName.trim()
        : 'your provider';
    const text = `You may receive a receipt from Stripe for the card payment above. That email is for this charge only—you were not charged twice. Any remaining balance is paid to ${provider} as you agreed.`;
    return `<p style="font-size:13px;color:#64748b;margin-top:14px;line-height:1.55;">${escapeHtml(text)}</p>`;
  }
  if (block.note?.trim()) {
    return `<p style="font-size:13px;color:#64748b;margin-top:14px;line-height:1.55;">${escapeHtml(block.note.trim())}</p>`;
  }
  return '';
}

function buildPaymentSummaryCard(
  payload: AvailabilityBookingNotificationPayload,
  options: AvailabilityBookingEmailOptions
): string {
  const block = payload.paymentSummary;
  if (!block?.rows?.length) return '';
  const title = (block.title ?? 'Payment').trim();
  const rowsHtml = block.rows
    .map(
      r => `
              <tr>
                <td class="detail-label" style="padding: 6px 0; color: #64748b;">
                  ${escapeHtml(r.label)}
                </td>
                <td class="detail-value" style="padding: 6px 0; color: #0f172a; text-align: right;">
                  ${escapeHtml(r.value)}
                </td>
              </tr>
            `
    )
    .join('');
  const noteHtml = paymentSummaryFootnoteHtml(block, options);

  return `
          <div class="card">
            <div class="section-title">${escapeHtml(title)}</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              ${rowsHtml}
            </table>
            ${noteHtml}
          </div>
        `;
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

export function buildAvailabilityBookingEmailHtml(
  payload: AvailabilityBookingNotificationPayload,
  options: AvailabilityBookingEmailOptions
): string {
  const timeLabel = formatTimeHHmm(payload.startTime);
  const dateLabel = formatDateLong(payload.scheduledDate);
  const durationLabel = formatDurationHours(payload.durationMinutes);

  const vehicleLine = formatVehicleLine(payload);
  const addOns = payload.selectedAddOns ?? [];
  const addOnsNames = addOns.map(a => a.name).join(', ');
  const optionLabel = payload.servicePriceOptionLabel?.trim();
  const serviceDisplayName = optionLabel
    ? `${payload.serviceName} — ${optionLabel}`
    : payload.serviceName;

  const hasBasePrice =
    payload.servicePriceCents != null && payload.servicePriceCents > 0;
  const basePriceLabel = hasBasePrice
    ? formatPriceCents(payload.servicePriceCents!)
    : null;

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

  const pricingRows = `
    ${
      hasBasePrice
        ? `
      <tr>
        <td class="detail-label" style="padding: 6px 0; color: #64748b;">
          ${escapeHtml(serviceDisplayName)}
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

  const vehicleRowHtml = vehicleLine
    ? `
      <tr>
        <td class="detail-label" style="padding-bottom: 12px;">Vehicle</td>
        <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(vehicleLine)}</td>
      </tr>
    `
    : '';

  const showPriceDetailsCard =
    Boolean(hasBasePrice) || (addOns?.length ?? 0) > 0;

  const priceDetailsCardHtml = showPriceDetailsCard
    ? `
          <div class="card" style="background-color:#ffffff;">
            <div class="section-title">Price details</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              ${pricingRows}
            </table>
            ${
              totalLabel
                ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; border-top: 1px solid #e2e8f0;">
              <tr>
                <td style="font-size: 15px; font-weight: 700; padding-top: 12px; color: #1e293b;">Appointment total</td>
                <td style="font-size: 15px; font-weight: 700; padding-top: 12px; text-align: right; color: #1e293b;">
                  ${escapeHtml(totalLabel)}
                </td>
              </tr>
            </table>`
                : ''
            }
          </div>
        `
    : '';

  const paymentSummaryCardHtml = buildPaymentSummaryCard(payload, options);

  const phoneRow = payload.customerPhone?.trim()
    ? `
      <tr>
        <td class="detail-label" style="padding-bottom: 12px;">Phone</td>
        <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(formatPhoneUsDisplay(payload.customerPhone.trim()))}</td>
      </tr>
    `
    : '';

  const heroHtml =
    options.audience === 'owner'
      ? `
          <h1 style="font-size:26px;margin:0;color:#1e293b;letter-spacing:-0.02em;">New appointment</h1>
          <p style="font-size:16px;color:#64748b;margin-top:8px;">You have a new appointment, here are the details:</p>
        `
      : `
          <h1 style="font-size:26px;margin:0;color:#1e293b;letter-spacing:-0.02em;">Your appointment is confirmed</h1>
          <p style="font-size:16px;color:#64748b;margin-top:8px;">Here are the details for your visit with ${escapeHtml(options.businessName)}:</p>
        `;

  const firstCardHtml =
    options.audience === 'owner'
      ? `
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
              ${phoneRow}
              ${vehicleRowHtml}
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
        `
      : `
          <div class="card">
            <div class="section-title">Your appointment</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Business</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(options.businessName)}</td>
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
          <div class="card">
            <div class="section-title">Your information</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Name</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.customerName)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Email</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.customerEmail)}</td>
              </tr>
              ${phoneRow}
              ${vehicleRowHtml}
            </table>
          </div>
        `;

  const ctaHtml =
    options.audience === 'owner'
      ? `<a href="${escapeHtml(options.dashboardBookingsUrl)}" class="button">View in dashboard</a>`
      : '';

  const footerHtml =
    options.audience === 'owner'
      ? `This email was sent because someone booked an appointment with your business.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.`
      : `You received this email because an appointment was scheduled using this address.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment</title>
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
          ${heroHtml}
        </td>
      </tr>

      <tr>
        <td class="content">
          ${firstCardHtml}

          <div class="card" style="background-color:#ffffff;">
            <div class="section-title">Service details</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">Service</td>
                <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(payload.serviceName)}</td>
              </tr>
              ${
                optionLabel
                  ? `<tr>
                      <td class="detail-label" style="padding-bottom: 12px;">Option</td>
                      <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(optionLabel)}</td>
                    </tr>`
                  : ''
              }
              ${
                addOns.length > 0
                  ? `<tr>
                      <td class="detail-label" style="padding-bottom: 12px;">Add-ons</td>
                      <td class="detail-value" style="padding-bottom: 12px;">${escapeHtml(addOnsNames)}</td>
                    </tr>`
                  : ''
              }
            </table>
          </div>

          ${priceDetailsCardHtml}

          ${paymentSummaryCardHtml}

          ${ctaHtml}
        </td>
      </tr>

      <tr>
        <td class="footer">
          ${footerHtml}
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

export function getAvailabilityBookingCustomerSubject(
  businessName: string
): string {
  return `Your appointment with ${businessName}`;
}
