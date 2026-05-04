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

/** One receipt line: even vertical rhythm; omit bottom border when row sits above the total bar. */
function receiptLine(
  label: string,
  value: string,
  opts?: { subtle?: boolean; lastBeforeTotal?: boolean }
) {
  const subtle = opts?.subtle === true;
  const bottom = opts?.lastBeforeTotal ? 'none' : '1px solid #e8ecf1';
  return `
              <tr class="mob-stack receipt-line">
                <td class="detail-label" style="padding:14px 0;border-bottom:${bottom};font-size:14px;line-height:1.45;vertical-align:top;color:${subtle ? '#64748b' : '#334155'};">
                  ${escapeHtml(label)}
                </td>
                <td class="detail-value" style="padding:14px 0;border-bottom:${bottom};font-size:14px;line-height:1.45;font-weight:600;color:#0f172a;text-align:right;vertical-align:top;font-variant-numeric:tabular-nums;">
                  ${escapeHtml(value)}
                </td>
              </tr>`;
}

function buildReceiptRowsHtml(payload: MaintenanceEnrollmentConfirmedPayload): {
  bodyRows: string;
  totalLabel: string;
  totalValue: string;
  methodNote: string;
} {
  const cents = Math.max(0, Math.round(payload.priceCents));
  const service = payload.serviceName.trim() || 'Visit';

  if (payload.paidWithCard) {
    return {
      bodyRows: receiptLine(service, formatMoney(cents), {
        lastBeforeTotal: true,
      }),
      totalLabel: 'Total charged',
      totalValue: formatMoney(cents),
      methodNote:
        'Paid by card through ServiceLink. Your bank may list this as its own line item—you were not charged twice.',
    };
  }

  if (cents > 0) {
    return {
      bodyRows: receiptLine(service, formatMoney(cents), {
        lastBeforeTotal: true,
      }),
      totalLabel: 'Amount due at visit',
      totalValue: formatMoney(cents),
      methodNote:
        'No charge online for this visit—bring payment to your appointment as you agreed with your provider.',
    };
  }

  return {
    bodyRows: receiptLine(service, '$0.00', {
      subtle: true,
      lastBeforeTotal: true,
    }),
    totalLabel: 'Total',
    totalValue: '$0.00',
    methodNote: 'No payment was collected online for this visit.',
  };
}

export function buildMaintenanceEnrollmentConfirmedPlainText(
  payload: MaintenanceEnrollmentConfirmedPayload
): string {
  const business = payload.businessName.trim() || 'Your detailer';
  const durationHuman = formatDurationForEmail(payload.durationMinutes);
  const cents = Math.max(0, Math.round(payload.priceCents));
  const money = formatMoney(cents);
  const service = payload.serviceName.trim() || 'Visit';

  const receiptBlock: string[] = [];
  if (payload.paidWithCard) {
    receiptBlock.push(`${service}: ${money}`);
    receiptBlock.push(`Total charged: ${money}`);
    receiptBlock.push(
      'Paid by card through ServiceLink. Your bank may list this as its own line item—you were not charged twice.'
    );
  } else if (cents > 0) {
    receiptBlock.push(`${service}: ${money}`);
    receiptBlock.push(`Amount due at visit: ${money}`);
    receiptBlock.push(
      'No charge online for this visit—bring payment to your appointment as you agreed with your provider.'
    );
  } else {
    receiptBlock.push(`${service}: $0.00`);
    receiptBlock.push('Total: $0.00');
    receiptBlock.push('No payment was collected online for this visit.');
  }

  return [
    `Your maintenance detail with ${business} is confirmed.`,
    '',
    'Visit',
    `When: ${formatDateLong(payload.visitDate)} at ${formatTimeHHmm(payload.visitTime)}`,
    `Duration: ${durationHuman}`,
    `Service: ${service}`,
    '',
    'Summary',
    ...receiptBlock,
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
  const visitWhen = `${escapeHtml(formatDateLong(payload.visitDate))} · ${escapeHtml(formatTimeHHmm(payload.visitTime))}`;
  const durationHuman = escapeHtml(
    formatDurationForEmail(payload.durationMinutes)
  );
  const service = escapeHtml(payload.serviceName.trim() || 'Visit');

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
    .hero { padding: 28px 28px 22px 28px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .content { padding: 24px 28px 32px 28px; }
    .card { background-color: #f8fafc; border-radius: 10px; padding: 20px 22px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 14px; }
    .detail-label { font-size: 13px; color: #64748b; }
    .detail-value { font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; }
    .receipt { background: #fafafa; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
    .receipt-head { background: #0f172a; color: #f8fafc; padding: 14px 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .receipt-body { padding: 0 20px; }
    .receipt-body table { border-collapse: collapse; }
    .receipt-total { background: #f1f5f9; padding: 18px 20px; border-top: 2px solid #0f172a; }
    .receipt-total .detail-label { font-size: 14px; font-weight: 700; color: #0f172a; }
    .receipt-total .detail-value { font-size: 18px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
    .method { font-size: 13px; color: #64748b; line-height: 1.6; margin: 18px 0 0 0; padding: 0 2px; }
    .footer { padding: 20px 28px 28px 28px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #e2e8f0; }
    @media screen and (max-width: 520px) {
      .hero h1 { font-size: 20px !important; }
      .hero { padding: 20px 16px 18px 16px !important; }
      .content { padding: 18px 16px 24px 16px !important; }
      .card { padding: 16px 14px !important; margin-bottom: 16px !important; }
      .receipt-body { padding-left: 16px !important; padding-right: 16px !important; }
      .receipt-total { padding: 16px 16px !important; }
      .mob-stack td { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: left !important; }
      .mob-stack td.detail-label { padding-top: 12px !important; padding-bottom: 4px !important; border-bottom: none !important; }
      .mob-stack td.detail-value { padding-top: 0 !important; padding-bottom: 12px !important; border-bottom: 1px solid #e8ecf1 !important; }
      .receipt-line:last-child td.detail-value { border-bottom: none !important; padding-bottom: 14px !important; }
      .receipt-total .mob-stack td.detail-value { text-align: left !important; padding-top: 6px !important; border-bottom: none !important; }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" role="presentation">
      <tr>
        <td class="hero">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Confirmation</p>
          <h1 style="font-size: 24px; margin: 0; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">You're all set</h1>
          <p style="font-size: 14px; color: #64748b; margin-top: 14px; line-height: 1.55; margin-bottom: 0;">
            Your maintenance detail with <strong style="color: #334155;">${business}</strong> is confirmed. Here is your visit summary.
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
                <td class="detail-label" style="padding: 0 12px 0 0; vertical-align: top;">Service</td>
                <td class="detail-value" style="padding: 0; vertical-align: top;">${service}</td>
              </tr>
            </table>
          </div>

          <div class="receipt">
            <div class="receipt-head">Summary</div>
            <div class="receipt-body">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                ${bodyRows}
              </table>
            </div>
            <div class="receipt-total">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                <tr class="mob-stack receipt-total-row">
                  <td class="detail-label" style="padding: 0; vertical-align: middle;">${escapeHtml(totalLabel)}</td>
                  <td class="detail-value" style="padding: 0; text-align: right; vertical-align: middle;">${escapeHtml(totalValue)}</td>
                </tr>
              </table>
            </div>
          </div>

          <p class="method">${escapeHtml(methodNote)}</p>
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
