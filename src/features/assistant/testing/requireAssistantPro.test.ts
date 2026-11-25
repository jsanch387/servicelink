import {
  ASSISTANT_PRO_REQUIRED_CODE,
  ASSISTANT_PRO_REQUIRED_ERROR,
  assistantProRequiredResponse,
  businessCanUseAssistant,
} from '@/features/assistant/server/requireAssistantPro';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock('@/features/pricing/server/ownerHasProAccessForBusiness', () => ({
  ownerHasProAccessForBusiness: vi.fn(),
}));

const ownerHasProAccessForBusinessMock = vi.mocked(
  ownerHasProAccessForBusiness
);

describe('requireAssistantPro', () => {
  beforeEach(() => {
    ownerHasProAccessForBusinessMock.mockReset();
  });

  it('allows Pro shops', async () => {
    ownerHasProAccessForBusinessMock.mockResolvedValue(true);

    expect(await businessCanUseAssistant('biz-1')).toBe(true);
    expect(await assistantProRequiredResponse('biz-1')).toBeNull();
  });

  it('returns 403 for free shops', async () => {
    ownerHasProAccessForBusinessMock.mockResolvedValue(false);

    expect(await businessCanUseAssistant('biz-1')).toBe(false);

    const response = await assistantProRequiredResponse('biz-1');
    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);

    const body = await response!.json();
    expect(body).toEqual({
      success: false,
      error: ASSISTANT_PRO_REQUIRED_ERROR,
      code: ASSISTANT_PRO_REQUIRED_CODE,
    });
  });
});
