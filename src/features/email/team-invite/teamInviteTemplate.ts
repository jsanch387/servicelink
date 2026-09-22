import { escapeHtml } from '../utils/escapeHtml';
import type { TeamInviteEmailPayload } from './types';

function shopName(businessName: string): string {
  return businessName.trim() || 'the team';
}

export function getTeamInviteEmailSubject(businessName: string): string {
  return `You're invited to join ${shopName(businessName)}`;
}

export function buildTeamInviteEmailPlainText(
  payload: TeamInviteEmailPayload
): string {
  const businessName = shopName(payload.businessName);
  return [
    `${businessName} invited you to join their team.`,
    '',
    'Accept the invite to get started:',
    payload.inviteUrl,
    '',
    'If you were not expecting this, you can ignore this email.',
    '',
    'Powered by ServiceLink',
  ].join('\n');
}

export function buildTeamInviteEmailHtml(
  payload: TeamInviteEmailPayload
): string {
  const businessName = escapeHtml(shopName(payload.businessName));
  const inviteUrl = escapeHtml(payload.inviteUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="background-color: #0a0a0a; border-radius: 16px 16px 0 0; padding: 30px 30px 26px;">
              <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa; font-weight: 700;">${businessName}</p>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; color: #ffffff; font-weight: 800;">
                You're invited
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border-radius: 0 0 16px 16px; border: 1px solid #e4e4e7; border-top: 0; padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #3f3f46;">
                <strong style="color: #18181b;">${businessName}</strong> invited you to join their team.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.65; color: #3f3f46;">
                Accept the invite to get started.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0;">
                <tr>
                  <td style="border-radius: 10px; background-color: #0a0a0a;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 26px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
                      Accept invite
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 22px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                Powered by ServiceLink
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
