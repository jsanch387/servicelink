import { escapeHtml } from '../utils/escapeHtml';
import { formatDurationForEmail } from '../utils/formatDurationForEmail';
import type { MaintenanceEnrollmentSentPayload } from './types';

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

/** Plain-text body for Resend (accessibility + clients without HTML). */
export function buildMaintenanceEnrollmentSentPlainText(
  payload: MaintenanceEnrollmentSentPayload
): string {
  const businessName = payload.businessName.trim() || 'Your detailer';
  const priceLabel = formatPriceWholeDollars(payload.priceCents);
  const hasAnchor =
    Boolean(payload.anchorDate?.trim()) && Boolean(payload.anchorTime?.trim());
  const dateLabel = hasAnchor
    ? formatDateLong(payload.anchorDate as string)
    : "You'll choose this when you open your link";
  const timeRowLabel = hasAnchor ? 'Time' : 'Visit length';
  const timeRowValue = hasAnchor
    ? `${formatTimeHHmm(payload.anchorTime as string)} · ${formatDurationForEmail(payload.durationMinutes)}`
    : formatDurationForEmail(payload.durationMinutes);
  const freqLabel =
    payload.frequencyWeeks === 1
      ? 'Every week'
      : `Every ${payload.frequencyWeeks} weeks`;

  return [
    `Hi ${payload.customerName.trim() || 'there'},`,
    '',
    `${businessName} sent you a secure link to review your maintenance detail. Open it to see the details, set your visit date if needed, and confirm or pay (depending on what ${businessName} offers).`,
    '',
    `Your invite link: ${payload.publicEnrollmentUrl}`,
    '',
    'Summary',
    `— Business: ${businessName}`,
    `— First visit: ${dateLabel}`,
    `— ${timeRowLabel}: ${timeRowValue}`,
    `— Frequency: ${freqLabel}`,
    '',
    'Service & pricing',
    `— Service: ${payload.serviceName}`,
    `— Price per visit: ${priceLabel}`,
    '',
    `You received this email because ${businessName} invited you to a maintenance detail.`,
    `© ${new Date().getFullYear()} ServiceLink`,
  ].join('\n');
}

export function buildMaintenanceEnrollmentSentHtml(
  payload: MaintenanceEnrollmentSentPayload
): string {
  const businessName = escapeHtml(payload.businessName);
  const priceLabel = formatPriceWholeDollars(payload.priceCents);
  const hasAnchor =
    Boolean(payload.anchorDate?.trim()) && Boolean(payload.anchorTime?.trim());
  const dateLabel = hasAnchor
    ? formatDateLong(payload.anchorDate as string)
    : "You'll choose this when you open your link";
  const timeRowLabel = hasAnchor ? 'Time' : 'Visit length';
  const timeRowValue = hasAnchor
    ? `${formatTimeHHmm(payload.anchorTime as string)} · ${formatDurationForEmail(payload.durationMinutes)}`
    : formatDurationForEmail(payload.durationMinutes);
  const freqLabel =
    payload.frequencyWeeks === 1
      ? 'Every week'
      : `Every ${payload.frequencyWeeks} weeks`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance detail from ${businessName}</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #4a4a4a; }
    .header { padding: 30px; text-align: center; background-color: #ffffff; }
    .hero { padding: 10px 30px 30px 30px; text-align: center; }
    .content { padding: 0 30px 40px 30px; }
    .card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 16px; }
    .detail-label { font-size: 14px; color: #64748b; }
    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; text-align: right; }
    .button { background-color: #ffffff; border-radius: 12px; color: #171717 !important; display: block; font-size: 16px; font-weight: 600; line-height: 50px; text-align: center; text-decoration: none; width: 100%; max-width: 100%; box-sizing: border-box; border: 1px solid #e4e4e7; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
    @media screen and (max-width: 520px) {
      .hero { padding: 10px 18px 22px 18px !important; }
      .hero h1 { font-size: 22px !important; line-height: 1.2 !important; }
      .content { padding: 0 16px 28px 16px !important; }
      .card { padding: 16px 14px !important; }
      .footer { padding: 22px 16px !important; }
      .mob-stack td { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: left !important; }
      .mob-stack td.detail-label { padding: 0 0 4px 0 !important; }
      .mob-stack td.detail-value { padding: 0 0 14px 0 !important; }
      .mob-stack tr:last-child td.detail-value { padding-bottom: 0 !important; }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" role="presentation">
      <tr><td class="header"><div style="height: 20px;"></div></td></tr>
      <tr>
        <td class="hero">
          <h1 style="font-size: 26px; margin: 0; color: #1e293b; letter-spacing: -0.02em;">Your maintenance detail</h1>
          <p style="font-size: 16px; color: #1e293b; margin-top: 12px; font-weight: 600;">Hi ${escapeHtml(payload.customerName)},</p>
          <p style="font-size: 16px; color: #64748b; margin-top: 8px; line-height: 1.5;">
            ${businessName} sent you a secure link to review your maintenance detail. Open it to see the details, pick your visit date if needed, and confirm or pay—whatever ${businessName} has set up for you.
          </p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="card">
            <div class="section-title">Summary</div>
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top; width: 42%;">Business</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${businessName}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top;">First visit</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(dateLabel)}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top;">${timeRowLabel}</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(timeRowValue)}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top;">Frequency</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(freqLabel)}</td>
              </tr>
            </table>
          </div>
          <div class="card" style="background-color: #ffffff;">
            <div class="section-title">Service &amp; pricing</div>
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 12px 0; vertical-align: top; width: 42%;">Service</td>
                <td class="detail-value" style="padding: 0 0 12px 0; vertical-align: top;">${escapeHtml(payload.serviceName)}</td>
              </tr>
              <tr class="mob-stack">
                <td class="detail-label" style="padding: 0 16px 0 0; vertical-align: top;">Price per visit</td>
                <td class="detail-value" style="padding: 0; vertical-align: top; color: #0f172a; font-weight: 700;">${escapeHtml(priceLabel)}</td>
              </tr>
            </table>
          </div>
          <p style="margin: 0 0 8px 0;">
            <a href="${escapeHtml(payload.publicEnrollmentUrl)}" class="button" target="_blank" rel="noopener noreferrer">Review maintenance detail</a>
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          You received this email because a business added you to a maintenance detail.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`.trim();
}

export function getMaintenanceEnrollmentSentSubject(
  businessName: string
): string {
  const name = businessName.trim() || 'Your detailer';
  return `Your maintenance detail link from ${name}`;
}
