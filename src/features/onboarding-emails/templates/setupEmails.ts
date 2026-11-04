import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { buildAppDownloadFooterRow } from '@/features/email/appDownloadFooter';
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
      text: plainText(
        [
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
        ],
        content.year
      ),
    };
  }

  if (key === 'A3_test_appointment') {
    return buildTestAppointmentEmail(content);
  }

  if (key === 'A4_receipt_review') {
    return buildReceiptReviewEmail(content);
  }

  if (key === 'A5_qr_code') {
    return buildQrCodeEmail(content);
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
    text: plainText(
      [
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
      ],
      content.year
    ),
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
      preheader: 'Book your first appointment and see it as a customer.',
      paragraphs: [
        'Hey there,',
        'Your booking page is ready. Book your first appointment and walk through it the way a customer would. You will see the page, the times, and the texts and emails that keep them updated.',
        'It is the quickest way to see why other businesses love ServiceLink.',
      ],
      buttonLabel: 'Book your first appointment',
      content,
    }),
    text: plainText(
      [
        'Hey there,',
        '',
        'Your booking page is ready. Book your first appointment and walk through it the way a customer would. You will see the page, the times, and the texts and emails that keep them updated.',
        '',
        'It is the quickest way to see why other businesses love ServiceLink.',
        '',
        `Book your first appointment: ${content.dashboardUrl}`,
        '',
        'Mark',
        'Founder, ServiceLink',
      ],
      content.year
    ),
  };
}

export function buildReceiptReviewEmail(content: SetupEmailContent): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'One appointment, and the follow-up is handled',
    html: layout({
      preheader: 'The receipt and the review go out for you.',
      paragraphs: [
        'Hey there,',
        'Book your first appointment, or send the link to someone you already know. Either one is enough.',
        'When you mark it complete, your customer gets the receipt on their phone and in their email. ServiceLink asks them for a review, so you don’t have to.',
        'That is the part most owners still do by hand. One booking turns it on.',
      ],
      buttonLabel: 'Book your first appointment',
      content,
    }),
    text: plainText(
      [
        'Hey there,',
        '',
        'Book your first appointment, or send the link to someone you already know. Either one is enough.',
        '',
        'When you mark it complete, your customer gets the receipt on their phone and in their email. ServiceLink asks them for a review, so you don’t have to.',
        '',
        'That is the part most owners still do by hand. One booking turns it on.',
        '',
        `Book your first appointment: ${content.dashboardUrl}`,
        '',
        'Mark',
        'Founder, ServiceLink',
      ],
      content.year
    ),
  };
}

export function buildQrCodeEmail(content: SetupEmailContent): {
  subject: string;
  html: string;
  text: string;
} {
  const links = [
    { href: IOS_APP_STORE_URL, label: 'Download on the App Store' },
    { href: GOOGLE_PLAY_STORE_URL, label: 'Get it on Google Play' },
  ];
  return {
    subject: 'Turn your cards into booking machines',
    html: layout({
      preheader: 'Grab your free QR code in the app.',
      paragraphs: [
        'Hey there,',
        'Download the ServiceLink app and get your free QR code. Put it on your cards, your van, and your flyers.',
        'When a customer scans it, they land on your booking link, ready to book or request a quote.',
      ],
      links,
      content,
    }),
    text: plainText(
      [
        'Hey there,',
        '',
        'Download the ServiceLink app and get your free QR code. Put it on your cards, your van, and your flyers.',
        '',
        'When a customer scans it, they land on your booking link, ready to book or request a quote.',
        '',
        ...links.map(link => `${link.label}: ${link.href}`),
        '',
        'Mark',
        'Founder, ServiceLink',
      ],
      content.year
    ),
  };
}

function plainText(lines: string[], year: number): string {
  return [
    ...lines,
    '',
    'Get the app',
    `Download on the App Store: ${IOS_APP_STORE_URL}`,
    `Get it on Google Play: ${GOOGLE_PLAY_STORE_URL}`,
    '',
    `© ${year} ServiceLink LLC`,
  ].join('\n');
}

function layout(input: {
  preheader: string;
  paragraphs: string[];
  buttonLabel?: string;
  links?: { href: string; label: string }[];
  content: SetupEmailContent;
}): string {
  const { content } = input;
  const body = input.paragraphs
    .map(
      paragraph =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:#18181b;">${escapeHtml(paragraph)}</p>`
    )
    .join('');
  const actions = (input.links ?? []).map(
    link =>
      `<p style="margin:0 0 12px;"><a href="${escapeHtml(link.href)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;padding:12px 18px;border-radius:10px;">${escapeHtml(link.label)}</a></p>`
  );
  if (input.buttonLabel) {
    actions.push(
      `<p style="margin:8px 0 20px;"><a href="${escapeHtml(content.dashboardUrl)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;padding:12px 18px;border-radius:10px;">${escapeHtml(input.buttonLabel)}</a></p>`
    );
  }

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
              ${actions.join('')}
              <p style="margin:0 0 4px;font-family:${FONT};font-size:16px;line-height:24px;color:#18181b;">Mark</p>
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;color:#71717a;">Founder, ServiceLink</p>
            </td>
          </tr>
          ${buildAppDownloadFooterRow(content.year)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
