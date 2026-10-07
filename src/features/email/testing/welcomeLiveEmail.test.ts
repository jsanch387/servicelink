import {
  buildWelcomeLiveHtml,
  WELCOME_LIVE_SUBJECT,
} from '@/features/email/welcome-live/welcomeLiveTemplate';
import { sendWelcomeLiveEmail } from '@/features/email/welcome-live/sendWelcomeLiveEmail';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock, getResendClientMock, getFromEmailMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getResendClientMock: vi.fn(),
  getFromEmailMock: vi.fn(),
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getResendClient: getResendClientMock,
  getFromEmail: getFromEmailMock,
}));

describe('welcome live email template', () => {
  it('uses the expected subject', () => {
    expect(WELCOME_LIVE_SUBJECT).toBe('🚀 Your business is live');
  });

  it('uses canonical myservicelink booking URL', () => {
    const html = buildWelcomeLiveHtml({
      businessSlug: 'sparkle-mobile-detailing',
    });

    expect(html).toContain(
      'https://myservicelink.app/sparkle-mobile-detailing'
    );
    expect(html).not.toContain('/book');
    expect(html).toContain("You're live");
    expect(html).toContain('Schedule an appointment');
    expect(html).toContain('Facebook groups and Nextdoor');
    expect(html).toContain(
      'Post a before-and-after and put your link under it.'
    );
    expect(html).toContain('Create your first post on social media');
    expect(html).toContain('https://instagram.com/myservicelink');
    expect(html).toContain('cid:welcome-instagram');
    expect(html).toContain('cid:welcome-app-store');
    expect(html).not.toContain('📷');
    expect(html).toContain('Follow us on Instagram');
    expect(html).toContain('ServiceLink LLC');
    expect(html).toContain(
      'https://apps.apple.com/us/app/servicelink-for-business/id6768877250'
    );
    expect(html).toContain(
      'https://play.google.com/store/apps/details?id=com.myservicelink.app'
    );
    expect(html).toContain('https://myservicelink.app/privacy');
    expect(html).toContain('https://myservicelink.app/terms');
    expect(html).toContain('experience the full system');
  });

  it('escapes/encodes untrusted slug content', () => {
    const html = buildWelcomeLiveHtml({
      businessSlug: 'slug"><script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain(
      'https://myservicelink.app/slug%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E'
    );
    expect(html).not.toContain('/book');
  });
});

describe('sendWelcomeLiveEmail', () => {
  beforeEach(() => {
    sendMock.mockReset();
    getResendClientMock.mockReset();
    getFromEmailMock.mockReset();
  });

  it('returns a clear error when RESEND_API_KEY is unavailable', async () => {
    getResendClientMock.mockReturnValue(null);

    const result = await sendWelcomeLiveEmail('owner@example.com', {
      businessSlug: 'sparkle-mobile-detailing',
    });

    expect(result).toEqual({
      sent: false,
      error: 'RESEND_API_KEY is not set',
    });
  });

  it('sends the welcome email with subject and html', async () => {
    getResendClientMock.mockReturnValue({
      emails: { send: sendMock },
    });
    getFromEmailMock.mockReturnValue('ServiceLink <hello@myservicelink.app>');
    sendMock.mockResolvedValue({
      data: { id: 're_123' },
      error: null,
    });

    const result = await sendWelcomeLiveEmail('owner@example.com', {
      businessSlug: 'sparkle-mobile-detailing',
    });

    expect(result).toEqual({ sent: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'ServiceLink <hello@myservicelink.app>',
        to: ['owner@example.com'],
        subject: WELCOME_LIVE_SUBJECT,
      })
    );
    expect(sendMock.mock.calls[0][0].html).toContain(
      'https://myservicelink.app/sparkle-mobile-detailing'
    );
    expect(sendMock.mock.calls[0][0].html).toContain('cid:welcome-instagram');
    expect(sendMock.mock.calls[0][0].html).toContain('cid:welcome-app-store');
    expect(sendMock.mock.calls[0][0].html).not.toContain('/book');
    const attachments = sendMock.mock.calls[0][0].attachments as Array<{
      contentId: string;
      content: Buffer;
    }>;
    expect(attachments.map(file => file.contentId).sort()).toEqual([
      'welcome-app-store',
      'welcome-instagram',
    ]);
    expect(attachments.every(file => file.content.length > 0)).toBe(true);
  });

  it('returns resend error message when provider rejects email', async () => {
    getResendClientMock.mockReturnValue({
      emails: { send: sendMock },
    });
    getFromEmailMock.mockReturnValue('ServiceLink <hello@myservicelink.app>');
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'domain not verified' },
    });

    const result = await sendWelcomeLiveEmail('owner@example.com', {
      businessSlug: 'sparkle-mobile-detailing',
    });

    expect(result).toEqual({
      sent: false,
      error: 'domain not verified',
    });
  });
});
