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
    expect(WELCOME_LIVE_SUBJECT).toBe('🚀 Your business is officially LIVE!');
  });

  it('uses canonical myservicelink booking URL', () => {
    const html = buildWelcomeLiveHtml({
      businessSlug: 'sparkle-mobile-detailing',
    });

    expect(html).toContain(
      'https://myservicelink.app/sparkle-mobile-detailing'
    );
    expect(html).toContain('Your booking link');
  });

  it('escapes/encodes untrusted slug content', () => {
    const html = buildWelcomeLiveHtml({
      businessSlug: 'slug"><script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain(
      'https://myservicelink.app/slug%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E'
    );
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
