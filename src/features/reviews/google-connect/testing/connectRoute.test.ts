import { POST } from '@/app/api/reviews/google/connect/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  resolveCurrentBusinessIdMock,
  startGoogleBusinessConnectMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  startGoogleBusinessConnectMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock(
  '@/features/reviews/google-connect/server/startGoogleBusinessConnect',
  () => ({
    startGoogleBusinessConnect: startGoogleBusinessConnectMock,
  })
);

describe('POST /api/reviews/google/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth errors', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Authentication required',
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/reviews/google/connect', {
        method: 'POST',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({
      success: false,
      error: 'Authentication required',
    });
  });

  it('returns a Google URL on success', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
      authMethod: 'cookie',
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    startGoogleBusinessConnectMock.mockReturnValue({
      ok: true,
      url: 'https://accounts.google.com/o/oauth2/v2/auth?state=x',
      cookie: {
        name: 'sl_gbp_oauth',
        value: 'nonce',
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 600,
      },
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/reviews/google/connect', {
        method: 'POST',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      url: 'https://accounts.google.com/o/oauth2/v2/auth?state=x',
    });
    expect(startGoogleBusinessConnectMock).toHaveBeenCalledWith({
      request: expect.any(Request),
      userId: 'user-1',
      businessId: 'biz-1',
    });
  });
});
