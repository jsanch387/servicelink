import {
  ASSISTANT_BETA_CHAT_TURN_LIMIT,
  ASSISTANT_BETA_TEXT_LIMIT,
} from '@/features/assistant/constants/assistantBetaLimits';
import {
  assistantYearMonthUtc,
  getAssistantChatUsage,
  getAssistantTextUsage,
  reserveAssistantChatTurn,
  reserveAssistantTextUsage,
} from '@/features/assistant/server/assistantUsageMonth';
import { describe, expect, it, vi } from 'vitest';

function adminWithUsage(sent: number | null, chatTurns: number | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data:
      sent === null && chatTurns === null
        ? null
        : {
            text_sent_count: sent ?? 0,
            chat_turn_count: chatTurns ?? 0,
          },
    error: null,
  });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle,
          })),
        })),
      })),
      upsert,
    })),
    _upsert: upsert,
    _maybeSingle: maybeSingle,
  };
}

describe('assistantUsageMonth', () => {
  it('formats UTC year-month', () => {
    expect(assistantYearMonthUtc(new Date('2026-03-05T12:00:00.000Z'))).toBe(
      '2026-03'
    );
  });

  it('reads remaining against the beta limit', async () => {
    const admin = adminWithUsage(5);
    const usage = await getAssistantTextUsage(
      admin as never,
      'biz-1',
      new Date('2026-11-20T12:00:00.000Z')
    );

    expect(usage).toEqual({
      yearMonth: '2026-11',
      sent: 5,
      limit: ASSISTANT_BETA_TEXT_LIMIT,
      remaining: ASSISTANT_BETA_TEXT_LIMIT - 5,
    });
  });

  it('blocks reserve when the batch would exceed the cap', async () => {
    const admin = adminWithUsage(ASSISTANT_BETA_TEXT_LIMIT - 1);
    const result = await reserveAssistantTextUsage(
      admin as never,
      'biz-1',
      2,
      new Date('2026-11-20T12:00:00.000Z')
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('limit_reached');
    expect(admin._upsert).not.toHaveBeenCalled();
  });

  it('reads and reserves chat turns against the beta limit', async () => {
    const admin = adminWithUsage(0, 4);
    const usage = await getAssistantChatUsage(
      admin as never,
      'biz-1',
      new Date('2026-11-20T12:00:00.000Z')
    );
    expect(usage).toEqual({
      yearMonth: '2026-11',
      used: 4,
      limit: ASSISTANT_BETA_CHAT_TURN_LIMIT,
      remaining: ASSISTANT_BETA_CHAT_TURN_LIMIT - 4,
    });

    const reserved = await reserveAssistantChatTurn(
      admin as never,
      'biz-1',
      new Date('2026-11-20T12:00:00.000Z')
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    expect(reserved.usage.used).toBe(5);
    expect(admin._upsert).toHaveBeenCalled();
  });

  it('blocks chat reserve at the monthly cap', async () => {
    const admin = adminWithUsage(0, ASSISTANT_BETA_CHAT_TURN_LIMIT);
    const result = await reserveAssistantChatTurn(
      admin as never,
      'biz-1',
      new Date('2026-11-20T12:00:00.000Z')
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('limit_reached');
    expect(admin._upsert).not.toHaveBeenCalled();
  });

  it('increments usage when under the cap', async () => {
    const admin = adminWithUsage(4);
    const result = await reserveAssistantTextUsage(
      admin as never,
      'biz-1',
      3,
      new Date('2026-11-20T12:00:00.000Z')
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usage.sent).toBe(7);
    expect(result.usage.remaining).toBe(ASSISTANT_BETA_TEXT_LIMIT - 7);
    expect(admin._upsert).toHaveBeenCalled();
  });
});
