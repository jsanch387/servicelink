import {
  ASSISTANT_CHAT_DISABLED_CODE,
  ASSISTANT_CHAT_LIMIT_CODE,
  assertAssistantChatAllowed,
  isAssistantChatDisabled,
} from '@/features/assistant/server/assistantChatGuards';
import { ASSISTANT_BETA_CHAT_TURN_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const reserveAssistantChatTurnMock = vi.fn();
const releaseAssistantChatTurnMock = vi.fn();
const assertAssistantChatRateLimitsMock = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock('@/features/assistant/server/assistantUsageMonth', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/assistant/server/assistantUsageMonth')
  >('@/features/assistant/server/assistantUsageMonth');
  return {
    ...actual,
    reserveAssistantChatTurn: (...args: unknown[]) =>
      reserveAssistantChatTurnMock(...args),
    releaseAssistantChatTurn: (...args: unknown[]) =>
      releaseAssistantChatTurnMock(...args),
  };
});

vi.mock('@/server/rateLimit/assistantChatRateLimit', () => ({
  assertAssistantChatRateLimits: (...args: unknown[]) =>
    assertAssistantChatRateLimitsMock(...args),
}));

describe('assistantChatGuards', () => {
  const previous = process.env.ASSISTANT_CHAT_DISABLED;

  beforeEach(() => {
    reserveAssistantChatTurnMock.mockReset();
    releaseAssistantChatTurnMock.mockReset();
    assertAssistantChatRateLimitsMock.mockReset();
    assertAssistantChatRateLimitsMock.mockResolvedValue({ ok: true });
    delete process.env.ASSISTANT_CHAT_DISABLED;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.ASSISTANT_CHAT_DISABLED;
    else process.env.ASSISTANT_CHAT_DISABLED = previous;
  });

  it('reads the kill switch', () => {
    expect(isAssistantChatDisabled()).toBe(false);
    process.env.ASSISTANT_CHAT_DISABLED = '1';
    expect(isAssistantChatDisabled()).toBe(true);
  });

  it('refuses when the kill switch is on', async () => {
    process.env.ASSISTANT_CHAT_DISABLED = 'true';
    const result = await assertAssistantChatAllowed({
      businessId: 'biz-1',
      request: new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
      }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(503);
    const body = await result.response.json();
    expect(body.code).toBe(ASSISTANT_CHAT_DISABLED_CODE);
    expect(reserveAssistantChatTurnMock).not.toHaveBeenCalled();
  });

  it('refuses when the monthly turn cap is hit', async () => {
    reserveAssistantChatTurnMock.mockResolvedValue({
      ok: false,
      reason: 'limit_reached',
      usage: {
        yearMonth: '2026-11',
        used: ASSISTANT_BETA_CHAT_TURN_LIMIT,
        limit: ASSISTANT_BETA_CHAT_TURN_LIMIT,
        remaining: 0,
      },
    });

    const result = await assertAssistantChatAllowed({
      businessId: 'biz-1',
      request: new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
      }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(429);
    const body = await result.response.json();
    expect(body.code).toBe(ASSISTANT_CHAT_LIMIT_CODE);
  });

  it('allows a turn under the cap', async () => {
    reserveAssistantChatTurnMock.mockResolvedValue({
      ok: true,
      usage: {
        yearMonth: '2026-11',
        used: 1,
        limit: ASSISTANT_BETA_CHAT_TURN_LIMIT,
        remaining: ASSISTANT_BETA_CHAT_TURN_LIMIT - 1,
      },
    });

    const result = await assertAssistantChatAllowed({
      businessId: 'biz-1',
      request: new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usage.used).toBe(1);
    await result.release();
    expect(releaseAssistantChatTurnMock).toHaveBeenCalled();
  });
});
