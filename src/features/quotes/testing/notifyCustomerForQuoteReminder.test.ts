import { notifyCustomerForQuoteReminder } from '@/features/quotes/server/reminders/notifyCustomerForQuoteReminder';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/quotes/server/reminders/claimQuoteCustomerReminder',
  () => ({
    claimQuoteCustomerReminder: vi.fn(),
  })
);

vi.mock(
  '@/features/quotes/server/reminders/findCustomerIdForQuoteContact',
  () => ({
    findCustomerIdForQuoteContact: vi.fn(),
  })
);

vi.mock('@/features/quotes/server/reminders/recordQuoteOutboundEvent', () => ({
  recordQuoteOutboundEvent: vi.fn(),
}));

vi.mock('@/features/email', () => ({
  sendQuoteCustomerReminderEmail: vi.fn(),
}));

vi.mock('@/features/sms', async () => {
  const actual =
    await vi.importActual<typeof import('@/features/sms')>('@/features/sms');
  return {
    ...actual,
    sendAndRecordSms: vi.fn(),
  };
});

import { sendQuoteCustomerReminderEmail } from '@/features/email';
import { claimQuoteCustomerReminder } from '@/features/quotes/server/reminders/claimQuoteCustomerReminder';
import { findCustomerIdForQuoteContact } from '@/features/quotes/server/reminders/findCustomerIdForQuoteContact';
import { recordQuoteOutboundEvent } from '@/features/quotes/server/reminders/recordQuoteOutboundEvent';
import { sendAndRecordSms } from '@/features/sms';

const publicQuoteUrl = 'https://myservicelink.app/q/token-hash-here';

const base = {
  quoteId: 'q1',
  businessId: 'biz-1',
  businessName: 'Acme Detail',
  customerName: 'Jane Doe',
  serviceName: 'Full detail',
  publicQuoteUrl,
};

describe('notifyCustomerForQuoteReminder', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips without claiming when there is no /q/ link', async () => {
    const result = await notifyCustomerForQuoteReminder({} as never, {
      ...base,
      publicQuoteUrl: '  ',
      customerEmail: 'jane@example.com',
      customerPhone: '5551234567',
    });

    expect(result).toEqual({
      claimed: false,
      email: 'skipped',
      sms: 'skipped',
    });
    expect(claimQuoteCustomerReminder).not.toHaveBeenCalled();
    expect(sendQuoteCustomerReminderEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('does not send when the quote was already claimed', async () => {
    vi.mocked(claimQuoteCustomerReminder).mockResolvedValue(false);

    const result = await notifyCustomerForQuoteReminder({} as never, {
      ...base,
      customerEmail: 'jane@example.com',
      customerPhone: '5551234567',
    });

    expect(result.claimed).toBe(false);
    expect(sendQuoteCustomerReminderEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('emails and texts the same /q/ URL', async () => {
    vi.mocked(claimQuoteCustomerReminder).mockResolvedValue(true);
    vi.mocked(findCustomerIdForQuoteContact).mockResolvedValue('cust-1');
    vi.mocked(sendQuoteCustomerReminderEmail).mockResolvedValue({ sent: true });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await notifyCustomerForQuoteReminder({} as never, {
      ...base,
      customerEmail: 'jane@example.com',
      customerPhone: '5551234567',
    });

    expect(result).toEqual({ claimed: true, email: 'sent', sms: 'sent' });
    expect(sendQuoteCustomerReminderEmail).toHaveBeenCalledWith(
      'jane@example.com',
      expect.objectContaining({ publicQuoteUrl })
    );
    expect(sendAndRecordSms).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'quote_reminder',
        quoteId: 'q1',
        to: '5551234567',
        customerId: 'cust-1',
        dedupeKey: 'q1:quote_reminder',
        message: expect.stringContaining(publicQuoteUrl),
      })
    );
    expect(recordQuoteOutboundEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        quoteId: 'q1',
        channel: 'email',
        type: 'quote_reminder',
        status: 'sent',
      })
    );
    expect(recordQuoteOutboundEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        quoteId: 'q1',
        channel: 'sms',
        type: 'quote_reminder',
        status: 'sent',
        smsMessageId: 'sms-1',
      })
    );
    const smsMessage = vi.mocked(sendAndRecordSms).mock.calls[0]?.[0]
      ?.message as string;
    expect(smsMessage).toContain('Acme Detail still has your quote open');
    expect(smsMessage).toContain('Reply STOP to opt out.');
  });

  it('skips SMS when the customer opted out, and still emails', async () => {
    vi.mocked(claimQuoteCustomerReminder).mockResolvedValue(true);
    vi.mocked(findCustomerIdForQuoteContact).mockResolvedValue('cust-1');
    vi.mocked(sendQuoteCustomerReminderEmail).mockResolvedValue({ sent: true });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: false,
      reason: 'sms_opt_out',
    });

    const result = await notifyCustomerForQuoteReminder({} as never, {
      ...base,
      customerEmail: 'jane@example.com',
      customerPhone: '5551234567',
    });

    expect(result).toEqual({ claimed: true, email: 'sent', sms: 'skipped' });
  });
});
