import { escapeHtml } from '../utils/escapeHtml';
import type { MembershipManageLinkPayload } from './types';

export function getMembershipManageLinkSubject(businessName: string): string {
  const name = businessName.trim() || 'your membership';
  return `Manage your subscription — ${name}`;
}

export function buildMembershipManageLinkPlainText(
  payload: MembershipManageLinkPayload
): string {
  const business = payload.businessName.trim() || 'the business';
  const plan = payload.planName.trim() || 'your plan';
  const hello = payload.customerName?.trim()
    ? `Hi ${payload.customerName.trim()},`
    : 'Hi,';

  return [
    hello,
    '',
    `Here’s your link to manage or cancel ${plan} with ${business}:`,
    payload.manageUrl.trim(),
    '',
    'If you didn’t request this, you can ignore this email.',
    '',
    '— ServiceLink',
  ].join('\n');
}

export function buildMembershipManageLinkHtml(
  payload: MembershipManageLinkPayload
): string {
  const business = escapeHtml(payload.businessName.trim() || 'Your membership');
  const plan = escapeHtml(payload.planName.trim() || 'Your plan');
  const manageUrl = escapeHtml(payload.manageUrl.trim());
  const hello = payload.customerName?.trim()
    ? `Hi ${escapeHtml(payload.customerName.trim())},`
    : 'Hi,';
  const subject = escapeHtml(
    getMembershipManageLinkSubject(payload.businessName)
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
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;font-weight:800;">Manage your plan</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 16px 16px;border:1px solid #e4e4e7;border-top:0;padding:28px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#18181b;">${hello}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3f3f46;">
                Use the button below to manage or cancel <strong style="color:#18181b;">${plan}</strong> with <strong style="color:#18181b;">${business}</strong>.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
                <tr>
                  <td style="border-radius:10px;background-color:#0a0a0a;">
                    <a href="${manageUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                      Manage or cancel
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;line-height:1.55;color:#a1a1aa;word-break:break-word;">
                Or open this link:<br>
                <a href="${manageUrl}" style="color:#52525b;text-decoration:underline;">${manageUrl}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:#a1a1aa;">
                If you didn’t request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
