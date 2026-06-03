import { REVIEW_STAR_COLOR } from '@/icons';
import { escapeHtml } from '../utils/escapeHtml';
import type { ReviewInviteEmailPayload } from './types';

const DASHBOARD_BG = '#0f0f0f';

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

function formatTimeHHmm(timeVal: string): string {
  const trimmed = timeVal.trim().slice(0, 5);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

function visitLine(scheduledDate: string, scheduledStartTime: string): string {
  return `${formatDateLong(scheduledDate)} · ${formatTimeHHmm(scheduledStartTime)}`;
}

export function getReviewInviteEmailSubject(businessName: string): string {
  const name = businessName.trim() || 'your provider';
  return `How was your visit with ${name}?`;
}
export function buildReviewInviteEmailPlainText(
  payload: ReviewInviteEmailPayload
): string {
  const businessName = payload.businessName.trim() || 'your provider';
  const customerName = payload.customerName.trim() || 'there';
  const serviceName = payload.serviceName.trim() || 'your appointment';
  const when = visitLine(payload.scheduledDate, payload.scheduledStartTime);

  return [
    'How did we do?',
    '',
    `Hey ${customerName} — thanks again for choosing ${businessName}. We just finished your ${serviceName}, and we'd honestly love to know how it turned out.`,
    '',
    'Your visit',
    `— ${serviceName}`,
    `— ${when}`,
    '',
    'Leave a review:',
    payload.publicReviewUrl,
    '',
    'This link is personal to you. If you did not receive this service, you can ignore this email.',
    '',
    `You received this email because ${businessName} asked for feedback after your visit.`,
    `© ${new Date().getFullYear()} ServiceLink`,
  ].join('\n');
}

export function buildReviewInviteEmailHtml(
  payload: ReviewInviteEmailPayload
): string {
  const businessName = escapeHtml(
    payload.businessName.trim() || 'your provider'
  );

  const customerName = escapeHtml(payload.customerName.trim() || 'there');
  const serviceName = escapeHtml(
    payload.serviceName.trim() || 'your appointment'
  );
  const whenLabel = escapeHtml(
    visitLine(payload.scheduledDate, payload.scheduledStartTime)
  );
  const reviewUrl = escapeHtml(payload.publicReviewUrl);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Leave a review</title>
</head>
<body style="margin:0;padding:0;background-color:${DASHBOARD_BG};font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${DASHBOARD_BG};">
    <tr>
      <td align="center" style="padding:40px 16px 48px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="border:1px solid rgba(255,255,255,0.1);border-radius:16px;background-color:rgba(255,255,255,0.04);padding:32px 28px 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="padding-bottom:24px;">
                    <div style="width:48px;height:48px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background-color:rgba(255,255,255,0.06);text-align:center;line-height:48px;font-size:22px;color:${REVIEW_STAR_COLOR};">&#9733;</div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">How did we do?</h1>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom:24px;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#9ca3af;">
                      Hey ${customerName} — thanks again for choosing ${businessName}. We just finished your ${serviceName}, and we&apos;d honestly love to know how it turned out.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
                    <p style="margin:0 0 8px 0;font-size:14px;font-weight:500;color:#d1d5db;">Your visit</p>
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:500;color:#ffffff;">${serviceName}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">${whenLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-top:28px;">
                    <a href="${reviewUrl}" target="_blank" rel="noopener noreferrer" style="display:block;width:100%;box-sizing:border-box;padding:14px 20px;border-radius:10px;background-color:#ffffff;color:#171717;font-size:15px;font-weight:600;text-align:center;text-decoration:none;">Leave a review</a>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-top:20px;">
                    <p style="margin:0;font-size:13px;line-height:1.55;color:#71717a;">
                      This link is personal to you. If you did not receive this service, you can ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0 8px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                You received this email because ${businessName} asked for feedback after your visit.<br />
                &copy; ${year} ServiceLink
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
