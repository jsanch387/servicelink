import type { AuthenticatedRequestError } from '@/libs/api/getAuthenticatedUser';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteAccountForUser } from '../server/deleteAccountForUser';
import { assertDeleteAccountRateLimit } from '../server/deleteAccountRateLimit';
import { handleDeleteAccountRequest } from '../server/deleteAccountRouteHandler';

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('../server/deleteAccountRateLimit', () => ({
  assertDeleteAccountRateLimit: vi.fn(),
}));

vi.mock('../server/deleteAccountForUser', () => ({
  deleteAccountForUser: vi.fn(),
}));

describe('handleDeleteAccountRequest', () => {
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

  it('returns auth error shape when not authenticated', async () => {
    const authError: AuthenticatedRequestError = {
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Authentication required',
    };
    vi.mocked(getAuthenticatedUser).mockResolvedValue(authError);

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'x@example.com' }),
    });

    const res = await handleDeleteAccountRequest(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Authentication required',
    });
    expect(assertDeleteAccountRateLimit).not.toHaveBeenCalled();
    expect(deleteAccountForUser).not.toHaveBeenCalled();
  });

  it('returns mismatch when confirmEmail does not match account email', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u1', 'owner@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'wrong@example.com' }),
    });

    const res = await handleDeleteAccountRequest(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('CONFIRM_EMAIL_MISMATCH');
    expect(assertDeleteAccountRateLimit).not.toHaveBeenCalled();
    expect(deleteAccountForUser).not.toHaveBeenCalled();
  });

  it('returns 429 with retry header when rate limited', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'bearer',
      user: makeMockUser('u-rate', 'owner@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });
    vi.mocked(assertDeleteAccountRateLimit).mockResolvedValue({
      ok: false,
      reason: 'user',
      retryAfterSec: 7,
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'owner@example.com' }),
    });

    const res = await handleDeleteAccountRequest(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.code).toBe('RATE_LIMITED');
    expect(res.headers.get('Retry-After')).toBe('7');
    expect(deleteAccountForUser).not.toHaveBeenCalled();
  });

  it('maps STRIPE_ERROR to 502', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u2', 'owner@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });
    vi.mocked(assertDeleteAccountRateLimit).mockResolvedValue({ ok: true });
    vi.mocked(deleteAccountForUser).mockResolvedValue({
      ok: false,
      code: 'STRIPE_ERROR',
      error: 'Stripe failed',
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'owner@example.com' }),
    });

    const res = await handleDeleteAccountRequest(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({
      success: false,
      code: 'STRIPE_ERROR',
      error: 'Stripe failed',
    });
  });

  it('returns success payload when deletion completes', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authMethod: 'cookie',
      user: makeMockUser('u3', 'owner@example.com'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
    });
    vi.mocked(assertDeleteAccountRateLimit).mockResolvedValue({ ok: true });
    vi.mocked(deleteAccountForUser).mockResolvedValue({
      ok: true,
      warnings: [],
    });

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'owner@example.com' }),
    });

    const res = await handleDeleteAccountRequest(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, warnings: [] });
    expect(deleteAccountForUser).toHaveBeenCalledWith({
      userId: 'u3',
      userEmail: 'owner@example.com',
    });
  });
});
