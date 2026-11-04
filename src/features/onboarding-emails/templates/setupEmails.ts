import { escapeHtml } from '@/features/email/utils/escapeHtml';

import type { SetupEmailKey } from '../constants';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface SetupEmailContent {
  dashboardUrl: string;
  privacyUrl: string;
  year: number;
}

export function buildSetupEmail(
  key: SetupEmailKey,
  content: SetupEmailContent
): { subject: string; html: string; text: string } {
  if (key === 'A1_setup_one_step') {
    return {
      subject: 'Your booking page is one step away',
      html: layout({
        preheader: 'Takes about a minute to finish.',
        paragraphs: [
          'Hey there,',
          'Looks like you got started but didn’t quite finish. You’re about a minute away from having a booking page you can send to customers.',
          'If something got confusing, just reply and tell me. I read these.',
        ],
        buttonLabel: 'Finish my booking page',
        content,
      }),
      text: [
        'Hey there,',
        '',
        'Looks like you got started but didn’t quite finish. You’re about a minute away from having a booking page you can send to customers.',
        '',
        `Finish my booking page: ${content.dashboardUrl}`,
        '',
        'If something got confusing, just reply and tell me. I read these.',
        '',
        'Mark',
        'Founder, ServiceLink',
      ].join('\n'),
    };
  }

  if (key === 'A3_test_appointment') {
    return buildTestAppointmentEmail(content);
  }

  return {
    subject: 'Still want your booking link?',
    html: layout({
      preheader: 'Last note from me about finishing setup.',
      paragraphs: [
        'Hey there,',
        'Last nudge from me on this one. Your page is mostly set up. Name your business and you get a link customers can book from, any time.',
        'If you got stuck, just reply and tell me. I read these.',
      ],
      buttonLabel: 'Finish setup',
      content,
    }),
    text: [
      'Hey there,',
      '',
      'Last nudge from me on this one. Your page is mostly set up. Name your business and you get a link customers can book from, any time.',
      '',
      `Finish setup: ${content.dashboardUrl}`,
      '',
      'If you got stuck, just reply and tell me. I read these.',
      '',
      'Mark',
      'Founder, ServiceLink',
    ].join('\n'),
  };
}

export function buildTestAppointmentEmail(content: SetupEmailContent): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Your booking page is ready',
    html: layout({
      preheader: 'Book a test appointment and see it as a customer.',
      paragraphs: [
        'Hey there,',
        'Your booking page is ready. Book a test appointment for yourself and walk through it the way a customer would. You will see the page, the times, and the texts and emails that keep them updated.',
        'It is the quickest way to see why other businesses love ServiceLink.',
      ],
      buttonLabel: 'Book a test appointment',
      content,
    }),
    text: [
      'Hey there,',
      '',
      'Your booking page is ready. Book a test appointment for yourself and walk through it the way a customer would. You will see the page, the times, and the texts and emails that keep them updated.',
      '',
      'It is the quickest way to see why other businesses love ServiceLink.',
      '',
      `Book a test appointment: ${content.dashboardUrl}`,
      '',
      'Mark',
      'Founder, ServiceLink',
    ].join('\n'),
  };
}

function layout(input: {
  preheader: string;
  paragraphs: string[];
  buttonLabel: string;
  content: SetupEmailContent;
}): string {
  const { content } = input;
  const body = input.paragraphs
    .map(
      paragraph =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:#18181b;">${escapeHtml(paragraph)}</p>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="font-family:${FONT};font-size:13px;letter-spacing:0.04em;color:#71717a;padding-bottom:20px;">ServiceLink</td>
          </tr>
          <tr>
            <td>
              ${body}
              <p style="margin:8px 0 20px;">
                <a href="${escapeHtml(content.dashboardUrl)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;padding:12px 18px;border-radius:10px;">${escapeHtml(input.buttonLabel)}</a>
              </p>
              <p style="margin:0 0 4px;font-family:${FONT};font-size:16px;line-height:24px;color:#18181b;">Mark</p>
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;color:#71717a;">Founder, ServiceLink</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;font-family:${FONT};font-size:12px;line-height:18px;color:#a1a1aa;">
              <a href="${escapeHtml(content.privacyUrl)}" style="color:#71717a;text-decoration:underline;">Privacy</a>
              &nbsp;&middot;&nbsp;
              &copy; ${content.year} ServiceLink LLC
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
