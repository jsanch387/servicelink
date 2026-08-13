import { escapeHtml } from '../utils/escapeHtml';
import type { MembershipVisitReminderPayload } from './types';

export function getMembershipVisitReminderSubject(
  businessName: string
): string {
  const name = businessName.trim() || 'your membership';
  return `Book your next visit — ${name}`;
}

export function buildMembershipVisitReminderPlainText(
  payload: MembershipVisitReminderPayload
): string {
  const business = payload.businessName.trim() || 'the business';
  const plan = payload.planName.trim() || 'your plan';
  const hello = payload.customerName?.trim()
    ? `Hi ${payload.customerName.trim()},`
    : 'Hi,';

  return [
    hello,
    '',
    `A new period of ${plan} with ${business} has started.`,
    'Pick a date and time for your next visit:',
    payload.scheduleUrl.trim(),
    '',
    '— ServiceLink',
  ].join('\n');
}

export function buildMembershipVisitReminderHtml(
  payload: MembershipVisitReminderPayload
): string {
  const business = escapeHtml(payload.businessName.trim() || 'Your membership');
  const plan = escapeHtml(payload.planName.trim() || 'Your plan');
  const scheduleUrl = escapeHtml(payload.scheduleUrl.trim());
  const hello = payload.customerName?.trim()
    ? `Hi ${escapeHtml(payload.customerName.trim())},`
    : 'Hi,';
  const subject = escapeHtml(
    getMembershipVisitReminderSubject(payload.businessName)
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="background-color:#0a0a0a;border-radius:16px 16px 0 0;padding:28px 28px 22px;">
              <p style="margin:0 0 10px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#a1a1aa;font-weight:700;">ServiceLink</p>
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;font-weight:800;">Book your next visit</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:28px;border-radius:0 0 16px 16px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#3f3f46;">${hello}</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#3f3f46;">
                A new period of <strong style="color:#18181b;">${plan}</strong> with
                <strong style="color:#18181b;">${business}</strong> has started.
                Choose a date and time that works for you.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background-color:#0a0a0a;border-radius:10px;">
                    <a href="${scheduleUrl}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Choose a date
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#71717a;word-break:break-all;">
                Or open this link:<br>${scheduleUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
