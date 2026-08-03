import type { AuthenticatedRequestError } from '@/libs/api/getAuthenticatedUser';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestAccountEmailChange } from '../server/requestAccountEmailChange';
import { assertUpdateAccountEmailRateLimit } from '../server/updateAccountEmailRateLimit';
import { handleUpdateAccountEmailRequest } from '../server/updateAccountEmailRouteHandler';

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('../server/updateAccountEmailRateLimit', () => ({
  assertUpdateAccountEmailRateLimit: vi.fn(),
}));

vi.mock('../server/requestAccountEmailChange', () => ({
  requestAccountEmailChange: vi.fn(),
}));

vi.mock('@/libs/stripe/appBaseUrl', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

describe('handleUpdateAccountEmailRequest', () => {
  const makeMockUser = (id: string, email: string) =>
    ({
      id,
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth error when not authenticated', async () => {
    const authError: AuthenticatedRequestError = {
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Authentication required',
    };
    vi.mocked(getAuthenticatedUser).mockResolvedValue(authError);

    const req = new NextRequest('http://localhost/api/account', {
      method: 'PATCH',
      body: JSON.stringify({ newEmail: 'new@example.com' }),
    });

    const res = await handleUpdateAccountEmailRequest(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Authentication required',
    });
    expect(assertUpdateAccountEmailRateLimit).not.toHaveBeenCalled();
    expect(requestAccountEmailChange).not.toHaveBeenCalled();
  });

  it('returns 400 when newEmail is missing', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u1', 'old@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });

    const res = await handleUpdateAccountEmailRequest(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_BODY');
    expect(requestAccountEmailChange).not.toHaveBeenCalled();
  });

  it('rate limits before calling update', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u1', 'old@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });
    vi.mocked(assertUpdateAccountEmailRateLimit).mockResolvedValue({
      ok: false,
      retryAfterSec: 42,
      reason: 'user',
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'PATCH',
      body: JSON.stringify({ newEmail: 'new@example.com' }),
    });

    const res = await handleUpdateAccountEmailRequest(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.code).toBe('RATE_LIMITED');
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(requestAccountEmailChange).not.toHaveBeenCalled();
  });

  it('returns success with pendingEmail', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = { auth: {} } as any;
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u1', 'old@example.com'),
      supabase,
    });
    vi.mocked(assertUpdateAccountEmailRateLimit).mockResolvedValue({
      ok: true,
    });
    vi.mocked(requestAccountEmailChange).mockResolvedValue({
      ok: true,
      pendingEmail: 'new@example.com',
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'PATCH',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        redirectOrigin: 'http://localhost:3000',
      }),
    });

    const res = await handleUpdateAccountEmailRequest(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pendingEmail).toBe('new@example.com');
    expect(requestAccountEmailChange).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase,
        currentEmail: 'old@example.com',
        newEmail: 'new@example.com',
        emailRedirectTo: expect.stringMatching(
          /\/auth\/callback\?.*next=%2Fdashboard%2Fsettings.*email_notice=updated/
        ),
      })
    );
  });
});
