import {
  applyAssistantSend,
  applyAssistantSkip,
} from '@/features/assistant/server/applyAssistantDecisions';
import { ASSISTANT_BETA_TEXT_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAssistantTextUsageMock,
  reserveAssistantTextUsageMock,
  recordAssistantActionsMock,
  sendAndRecordSmsMock,
  resolveAssistantReviewInviteUrlMock,
} = vi.hoisted(() => ({
  getAssistantTextUsageMock: vi.fn(),
  reserveAssistantTextUsageMock: vi.fn(),
  recordAssistantActionsMock: vi.fn(),
  sendAndRecordSmsMock: vi.fn(),
  resolveAssistantReviewInviteUrlMock: vi.fn(),
}));

vi.mock('@/features/assistant/server/assistantUsageMonth', () => ({
  getAssistantTextUsage: getAssistantTextUsageMock,
  reserveAssistantTextUsage: reserveAssistantTextUsageMock,
  releaseAssistantTextUsage: vi.fn(),
}));

vi.mock('@/features/assistant/server/recordAssistantActions', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/assistant/server/recordAssistantActions')
  >('@/features/assistant/server/recordAssistantActions');
  return {
    ...actual,
    recordAssistantActions: recordAssistantActionsMock,
  };
});

vi.mock('@/features/sms', () => ({
  sendAndRecordSms: sendAndRecordSmsMock,
}));

vi.mock(
  '@/features/reviews/server/resolveAssistantReviewInviteUrl',
  async () => {
    const actual = await vi.importActual<
      typeof import('@/features/reviews/server/resolveAssistantReviewInviteUrl')
    >('@/features/reviews/server/resolveAssistantReviewInviteUrl');
    return {
      ...actual,
      resolveAssistantReviewInviteUrl: resolveAssistantReviewInviteUrlMock,
    };
  }
);

const usage = {
  yearMonth: '2026-11',
  sent: 1,
  limit: ASSISTANT_BETA_TEXT_LIMIT,
  remaining: ASSISTANT_BETA_TEXT_LIMIT - 1,
};

function adminWithPhones(phones: Record<string, string | null>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: Object.entries(phones).map(([id, phone]) => ({ id, phone })),
            error: null,
          }),
        })),
      })),
    })),
  };
}

describe('applyAssistantDecisions', () => {
  beforeEach(() => {
    getAssistantTextUsageMock.mockReset();
    reserveAssistantTextUsageMock.mockReset();
    recordAssistantActionsMock.mockReset();
    sendAndRecordSmsMock.mockReset();
    resolveAssistantReviewInviteUrlMock.mockReset();
    getAssistantTextUsageMock.mockResolvedValue(usage);
    recordAssistantActionsMock.mockResolvedValue({ ok: true, created: true });
    reserveAssistantTextUsageMock.mockResolvedValue({
      ok: true,
      usage: { ...usage, sent: 2, remaining: ASSISTANT_BETA_TEXT_LIMIT - 2 },
    });
    resolveAssistantReviewInviteUrlMock.mockResolvedValue({
      ok: true,
      inviteId: 'inv-1',
      url: 'https://myservicelink.app/review/tok-abc',
    });
  });

  it('records skips without reserving quota or sending SMS', async () => {
    const result = await applyAssistantSkip({
      admin: {} as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          subject: 'review_followup',
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(reserveAssistantTextUsageMock).not.toHaveBeenCalled();
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
    expect(recordAssistantActionsMock).toHaveBeenCalled();
  });

  it('sends SMS then records action and quota on success', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          subject: 'rebook_checkin',
          body: 'Hey',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(1);
    expect(sendAndRecordSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assistant_rebook_checkin',
        to: '+15551234567',
        message: 'Hey',
      })
    );
    expect(recordAssistantActionsMock).toHaveBeenCalled();
    expect(reserveAssistantTextUsageMock).toHaveBeenCalledWith(
      expect.anything(),
      'biz-1',
      1
    );
    expect(result.results?.[0]).toMatchObject({
      customerId: 'c1',
      ok: true,
      smsMessageId: 'sms-1',
    });
  });

  it('does not count quota when SMS fails', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: false,
      reason: 'sms_opt_out',
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'Hi [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(0);
    expect(reserveAssistantTextUsageMock).not.toHaveBeenCalled();
    expect(recordAssistantActionsMock).not.toHaveBeenCalled();
    expect(result.results?.[0]).toMatchObject({
      ok: false,
      reason: 'sms_opt_out',
    });
  });

  it('injects a unique review URL before sending', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'Please review: [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(resolveAssistantReviewInviteUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: 'c1',
        bookingId: 'b1',
      })
    );
    expect(sendAndRecordSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Please review: https://myservicelink.app/review/tok-abc',
      })
    );
  });

  it('skips send when the review invite cannot be resolved', async () => {
    resolveAssistantReviewInviteUrlMock.mockResolvedValue({
      ok: false,
      reason: 'no_booking',
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          subject: 'review_followup',
          body: 'Hi [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(0);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
    expect(result.results?.[0]?.reason).toBe('no_booking');
  });

  it('partial batch: counts only successes', async () => {
    sendAndRecordSmsMock
      .mockResolvedValueOnce({ sent: true, messageId: 'sms-1' })
      .mockResolvedValueOnce({ sent: false, reason: 'no_phone' });

    const result = await applyAssistantSend({
      admin: adminWithPhones({
        c1: '+15551111111',
        c2: null,
      }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'A [review link]',
        },
        {
          customerId: 'c2',
          bookingId: 'b2',
          subject: 'review_followup',
          body: 'B [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(1);
    expect(reserveAssistantTextUsageMock).toHaveBeenCalledTimes(1);
    expect(result.results?.map(r => r.ok)).toEqual([true, false]);
  });

  it('stops mid-batch when quota is exhausted', async () => {
    getAssistantTextUsageMock.mockResolvedValue({
      ...usage,
      sent: ASSISTANT_BETA_TEXT_LIMIT - 1,
      remaining: 1,
    });
    sendAndRecordSmsMock.mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });
    reserveAssistantTextUsageMock.mockResolvedValue({
      ok: true,
      usage: {
        yearMonth: '2026-11',
        sent: ASSISTANT_BETA_TEXT_LIMIT,
        limit: ASSISTANT_BETA_TEXT_LIMIT,
        remaining: 0,
      },
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({
        c1: '+15551111111',
        c2: '+15552222222',
      }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'A [review link]',
        },
        {
          customerId: 'c2',
          bookingId: 'b2',
          subject: 'review_followup',
          body: 'B [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(1);
    expect(sendAndRecordSmsMock).toHaveBeenCalledTimes(1);
    expect(result.results?.[1]).toMatchObject({
      ok: false,
      reason: 'limit_reached',
    });
  });

  it('treats same-day SMS duplicate as delivered', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: false,
      reason: 'duplicate',
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'Hi [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(1);
    expect(recordAssistantActionsMock).toHaveBeenCalled();
    expect(reserveAssistantTextUsageMock).toHaveBeenCalled();
  });

  it('does not burn quota again when sent action already exists', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });
    recordAssistantActionsMock.mockResolvedValue({
      ok: true,
      created: false,
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'Hi [review link]',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recorded).toBe(1);
    expect(reserveAssistantTextUsageMock).not.toHaveBeenCalled();
  });

  it('returns limit_reached when remaining is already 0', async () => {
    getAssistantTextUsageMock.mockResolvedValue({
      ...usage,
      sent: ASSISTANT_BETA_TEXT_LIMIT,
      remaining: 0,
    });

    const result = await applyAssistantSend({
      admin: adminWithPhones({ c1: '+15551234567' }) as never,
      businessId: 'biz-1',
      actorUserId: 'user-1',
      items: [
        {
          customerId: 'c1',
          bookingId: 'b1',
          subject: 'review_followup',
          body: 'Hi [review link]',
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('limit_reached');
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });
});
