import { GET } from '@/app/api/assistant/today/route';
import { ASSISTANT_BETA_TEXT_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import { emptyAssistantToday } from '@/features/assistant/today/buildAssistantToday';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  requireBusinessPermissionMock,
  loadAssistantTodayMock,
  getAssistantTextUsageMock,
  createSupabaseAdminClientMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  requireBusinessPermissionMock: vi.fn(),
  loadAssistantTodayMock: vi.fn(),
  getAssistantTextUsageMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/features/team/server/requireBusinessPermission', () => ({
  requireBusinessPermission: requireBusinessPermissionMock,
}));

vi.mock('@/features/assistant/today/loadAssistantToday', () => ({
  loadAssistantToday: loadAssistantTodayMock,
}));

vi.mock('@/features/assistant/server/assistantUsageMonth', () => ({
  getAssistantTextUsage: getAssistantTextUsageMock,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

describe('GET /api/assistant/today', () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
    requireBusinessPermissionMock.mockReset();
    loadAssistantTodayMock.mockReset();
    getAssistantTextUsageMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
    createSupabaseAdminClientMock.mockReturnValue({ tag: 'admin' });
  });

  it('returns 401 when the session is missing', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Authentication required',
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const response = await GET(
      new Request('http://localhost/api/assistant/today')
    );

    expect(response.status).toBe(401);
    expect(requireBusinessPermissionMock).not.toHaveBeenCalled();
    expect(loadAssistantTodayMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the actor lacks customers.read', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireBusinessPermissionMock.mockResolvedValue({
      ok: false,
      error: 'Forbidden',
      status: 403,
    });

    const response = await GET(
      new Request('http://localhost/api/assistant/today', {
        headers: { Authorization: 'Bearer token' },
      })
    );

    expect(response.status).toBe(403);
    expect(loadAssistantTodayMock).not.toHaveBeenCalled();
  });

  it('returns reviews, check-ins, and usage for an allowed actor', async () => {
    const today = emptyAssistantToday(new Date('2026-10-20T15:00:00.000Z'));
    const usage = {
      yearMonth: '2026-10',
      sent: 2,
      limit: ASSISTANT_BETA_TEXT_LIMIT,
      remaining: ASSISTANT_BETA_TEXT_LIMIT - 2,
    };
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: { tag: 'client' },
      authMethod: 'cookie',
    });
    requireBusinessPermissionMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
      context: { businessId: 'biz-1', userId: 'user-1' },
    });
    loadAssistantTodayMock.mockResolvedValue(today);
    getAssistantTextUsageMock.mockResolvedValue(usage);

    const response = await GET(
      new Request('http://localhost/api/assistant/today')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.today).toEqual(today);
    expect(body.usage).toEqual(usage);
    expect(loadAssistantTodayMock).toHaveBeenCalledWith(
      { tag: 'client' },
      'biz-1'
    );
    expect(getAssistantTextUsageMock).toHaveBeenCalledWith(
      { tag: 'admin' },
      'biz-1'
    );
  });
});
