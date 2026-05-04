import { escapeHtml } from '../utils/escapeHtml';
import { formatDurationForEmail } from '../utils/formatDurationForEmail';
import type { MaintenanceEnrollmentConfirmedPayload } from './types';

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, cents) / 100);
}

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeHHmm(hhmm: string): string {
  const trimmed = hhmm.trim().slice(0, 5);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

function frequencyLabel(weeks: number): string {
  if (weeks <= 1) return 'Every week';
  return `Every ${weeks} weeks`;
}

function buildReceiptRowsHtml(payload: MaintenanceEnrollmentConfirmedPayload): {
  bodyRows: string;
  totalLabel: string;
  totalValue: string;
  methodNote: string;
} {
  const cents = Math.max(0, Math.round(payload.priceCents));
  const line = (label: string, value: string, subtle?: boolean) => `
              <tr class="mob-stack">
                <td class="detail-label" style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:${subtle ? '#64748b' : '#334155'};">
                  ${escapeHtml(label)}
                </td>
                <td class="detail-value" style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums;">
                  ${escapeHtml(value)}
                </td>
              </tr>`;

  if (payload.paidWithCard) {
    return {
      bodyRows:
        line(`${payload.serviceName} (this appointment)`, formatMoney(cents)) +
        line('Paid online (card)', formatMoney(cents), true),
      totalLabel: 'Total charged',
      totalValue: formatMoney(cents),
      methodNote:
        'This receipt reflects the card payment processed through ServiceLink. You may also get a separate receipt from your card provider.',
    };
  }

  if (cents > 0) {
    return {
      bodyRows:
        line(`${payload.serviceName} (this appointment)`, formatMoney(cents)) +
        line('Paid online', '$0.00', true) +
        line('Balance due at your visit', formatMoney(cents), true),
      totalLabel: 'Amount due at visit',
      totalValue: formatMoney(cents),
      methodNote:
        'No card charge for this visit—you agreed to pay your provider in person. Bring payment as you arranged with them.',
    };
  }

  return {
    bodyRows: line('This visit', 'No charge recorded', true),
    totalLabel: 'Total',
    totalValue: '$0.00',
    methodNote: 'No payment was collected online for this visit.',
  };
}

export function buildMaintenanceEnrollmentConfirmedPlainText(
  payload: MaintenanceEnrollmentConfirmedPayload
): string {
  const business = payload.businessName.trim() || 'Your detailer';
  const name = payload.customerName.trim() || 'there';
  const durationHuman = formatDurationForEmail(payload.durationMinutes);
  const cents = Math.max(0, Math.round(payload.priceCents));
  const money = formatMoney(cents);

  const visitLine = `${payload.serviceName}: ${money}`;
  const receiptLines: string[] = [];
  if (payload.paidWithCard) {
    receiptLines.push(visitLine);
    receiptLines.push(`Paid online (card): ${money}`);
    receiptLines.push(`TOTAL CHARGED: ${money}`);
  } else if (cents > 0) {
    receiptLines.push(visitLine);
    receiptLines.push('Paid online: $0.00');
    receiptLines.push(`AMOUNT DUE AT VISIT: ${money}`);
  } else {
    receiptLines.push('No charge recorded for this visit.');
  }

  return [
    `Hi ${name},`,
    '',
    `Your maintenance detail with ${business} is confirmed.`,
    '',
    '— Visit —',
    `When: ${formatDateLong(payload.visitDate)} at ${formatTimeHHmm(payload.visitTime)}`,
    `Duration: ${durationHuman}`,
    `Frequency: ${frequencyLabel(payload.frequencyWeeks)}`,
    `Service: ${payload.serviceName}`,
    '',
    '— Receipt —',
    ...receiptLines,
    `Payment: ${payload.paymentSummary}`,
    '',
    `${business} has this visit on their calendar. To reschedule, contact them directly.`,
    '',
    `© ${new Date().getFullYear()} ServiceLink`,
  ].join('\n');
}

export function buildMaintenanceEnrollmentConfirmedHtml(
  payload: MaintenanceEnrollmentConfirmedPayload
): string {
  const business = escapeHtml(payload.businessName.trim() || 'Your detailer');
  const name = escapeHtml(payload.customerName.trim() || 'there');
  const visitWhen = `${escapeHtml(formatDateLong(payload.visitDate))} · ${escapeHtml(formatTimeHHmm(payload.visitTime))}`;
  const durationHuman = escapeHtml(
    formatDurationForEmail(payload.durationMinutes)
  );
  const freq = escapeHtml(frequencyLabel(payload.frequencyWeeks));
  const service = escapeHtml(payload.serviceName);
  const pay = escapeHtml(payload.paymentSummary);

  const { bodyRows, totalLabel, totalValue, methodNote } =
    buildReceiptRowsHtml(payload);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance detail confirmed</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #eef2f6; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #eef2f6; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #334155; border: 1px solid #e2e8f0; border-radius: 2px; }
    .hero { padding: 28px 28px 20px 28px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .content { padding: 24px 28px 32px 28px; }
    .card { background-color: #f8fafc; border-radius: 10px; padding: 20px 22px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 14px; }
    .detail-label { font-size: 13px; color: #64748b; }
    .detail-value { font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; }
    .receipt { background: #fafafa; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
    .receipt-head { background: #0f172a; color: #f8fafc; padding: 12px 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .receipt-body { padding: 4px 20px 8px 20px; }
    .receipt-total { background: #f1f5f9; padding: 16px 20px; border-top: 2px solid #0f172a; }
    .method { font-size: 13px; color: #64748b; line-height: 1.55; padding: 0 4px 8px 4px; }
    .footer { padding: 20px 28px 28px 28px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #e2e8f0; }
    @media screen and (max-width: 520px) {
      .hero h1 { font-size: 20px !important; }
      .hero { padding: 20px 16px 16px 16px !important; }
      .content { padding: 18px 16px 24px 16px !important; }
      .card { padding: 16px 14px !important; margin-bottom: 16px !important; }
      .receipt-body { padding-left: 14px !important; padding-right: 14px !important; }
      .receipt-total { padding-left: 14px !important; padding-right: 14px !important; }
      .mob-stack td { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: left !important; }
      .mob-stack td.detail-label { padding: 0 0 4px 0 !important; }
      .mob-stack td.detail-value { padding: 0 0 14px 0 !important; }
      .mob-stack tr:last-child td.detail-value { padding-bottom: 0 !important; }
      .receipt-total .mob-stack td.detail-value { text-align: left !important; padding-top: 6px !important; }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" role="presentation">
      <tr>
        <td class="hero">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Confirmation & receipt</p>
          <h1 style="font-size: 24px; margin: 0; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">You're all set</h1>
          <p style="font-size: 15px; color: #1e293b; margin-top: 12px; font-weight: 600;">Hi ${name},</p>
          <p style="font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.55; margin-bottom: 0;">
            Your maintenance detail with <strong style="color: #334155;">${business}</strong> is confirmed. Below is your visit summary and a payment receipt for this appointment.
          </p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="card">
            <div class="section-title">Visit details</div>
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 12px 10px 0; vertical-align: top; width: 38%;">Date &amp; time</td>
                <td class="detail-value" style="padding: 0 0 10px 0; vertical-align: top;">${visitWhen}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 12px 10px 0; vertical-align: top;">Duration</td>
                <td class="detail-value" style="padding: 0 0 10px 0; vertical-align: top;">${durationHuman}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 12px 10px 0; vertical-align: top;">Frequency</td>
                <td class="detail-value" style="padding: 0 0 10px 0; vertical-align: top;">${freq}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 12px 0 0; vertical-align: top;">Service</td>
                <td class="detail-value" style="padding: 0; vertical-align: top;">${service}</td>
              </tr>
            </table>
          </div>

          <div class="receipt">
            <div class="receipt-head">Receipt</div>
            <div class="receipt-body">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                ${bodyRows}
              </table>
            </div>
            <div class="receipt-total">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                <tr class="mob-stack receipt-total-row">
                  <td class="detail-label" style="font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(totalLabel)}</td>
                  <td class="detail-value" style="font-size: 18px; font-weight: 800; color: #0f172a; text-align: right; font-variant-numeric: tabular-nums;">${escapeHtml(totalValue)}</td>
                </tr>
              </table>
            </div>
          </div>

          <p class="method">${escapeHtml(methodNote)}</p>
          <p style="margin:12px 0 0 0;font-size:13px;color:#475569;"><strong>Payment method on file:</strong> ${pay}</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          ${business} has this visit on their calendar. To reschedule, contact them directly.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`.trim();
}

export function getMaintenanceEnrollmentConfirmedSubject(
  businessName: string
): string {
  const name = businessName.trim() || 'Your detailer';
  return `Maintenance detail confirmed — ${name}`;
}
