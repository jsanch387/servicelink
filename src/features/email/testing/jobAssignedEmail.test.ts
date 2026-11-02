import {
  buildJobAssignedEmailHtml,
  getJobAssignedEmailSubject,
} from '@/features/email/job-assigned/jobAssignedTemplate';
import { sendJobAssignedEmail } from '@/features/email/job-assigned/sendJobAssignedEmail';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const payload = {
  businessName: 'Sparkle Mobile',
  customerName: 'Alex Rivera',
  serviceName: 'Full detail',
  scheduledDateLabel: 'Friday, September 18',
  startTimeLabel: '9:00 AM',
  bookingsUrl: 'https://myservicelink.app/dashboard/bookings',
};

const { sendMock, getResendClientMock, getFromEmailMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getResendClientMock: vi.fn(),
  getFromEmailMock: vi.fn(),
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getResendClient: getResendClientMock,
  getFromEmail: getFromEmailMock,
}));

describe('job assigned email template', () => {
  it('uses the shop in the subject', () => {
    expect(getJobAssignedEmailSubject('Sparkle Mobile')).toBe(
      "You've been assigned a job at Sparkle Mobile"
    );
  });

  it('escapes untrusted HTML in the body', () => {
    const html = buildJobAssignedEmailHtml({
      ...payload,
      customerName: '<script>alert(1)</script>',
      businessName: 'Shop <b>Name</b>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Shop &lt;b&gt;Name&lt;/b&gt;');
    expect(html).toContain(payload.bookingsUrl);
  });
});

describe('sendJobAssignedEmail', () => {
  beforeEach(() => {
    sendMock.mockReset();
    getResendClientMock.mockReset();
    getFromEmailMock.mockReset();
  });

  it('returns a clear error when RESEND_API_KEY is unavailable', async () => {
    getResendClientMock.mockReturnValue(null);

    const result = await sendJobAssignedEmail('jose@example.com', payload);

    expect(result).toEqual({
      sent: false,
      error: 'RESEND_API_KEY is not set',
    });
  });

  it('sends the assigned-job email', async () => {
    getResendClientMock.mockReturnValue({
      emails: { send: sendMock },
    });
    getFromEmailMock.mockReturnValue('ServiceLink <hello@myservicelink.app>');
    sendMock.mockResolvedValue({
      data: { id: 're_123' },
      error: null,
    });

    const result = await sendJobAssignedEmail('jose@example.com', payload);

    expect(result).toEqual({ sent: true, messageId: 're_123' });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'ServiceLink <hello@myservicelink.app>',
        to: ['jose@example.com'],
        subject: "You've been assigned a job at Sparkle Mobile",
      })
    );
    expect(sendMock.mock.calls[0][0].html).toContain('Alex Rivera');
  });
});
