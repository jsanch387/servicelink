import { ASSISTANT_BETA_TEXT_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import {
  assistantYearMonthUtc,
  getAssistantTextUsage,
  reserveAssistantTextUsage,
} from '@/features/assistant/server/assistantUsageMonth';
import { describe, expect, it, vi } from 'vitest';

function adminWithUsage(sent: number | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: sent === null ? null : { text_sent_count: sent },
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
