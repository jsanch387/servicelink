import { POST } from '@/app/api/team/invites/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  requireOwnedBusinessMock,
  createTeamInviteMock,
  createSupabaseAdminClientMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  requireOwnedBusinessMock: vi.fn(),
  createTeamInviteMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/features/team/server/requireOwnedBusiness', () => ({
  requireOwnedBusiness: requireOwnedBusinessMock,
}));

vi.mock('@/features/team/server/createTeamInvite', () => ({
  createTeamInvite: createTeamInviteMock,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

function postInvite(
  body: { email?: string; name?: string } = { email: 'jose@shop.com' },
  headers?: HeadersInit
) {
  return POST(
    new Request('http://localhost/api/team/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /api/team/invites', () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
    requireOwnedBusinessMock.mockReset();
    createTeamInviteMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { business_name: 'Sparkle Auto' },
              error: null,
            }),
          }),
        }),
      }),
    });
  });

  it('returns 401 when Bearer or session is missing', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Invalid or expired session',
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const response = await postInvite(
      { email: 'jose@shop.com' },
      {
        Authorization: 'Bearer bad-token',
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid or expired session',
    });
    expect(requireOwnedBusinessMock).not.toHaveBeenCalled();
  });

  it('returns 403 when a member tries to invite', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'member-1', email: 'jose@shop.com' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireOwnedBusinessMock.mockResolvedValue({
      ok: false,
      error: 'Only the owner can manage the team',
      status: 403,
    });

    const response = await postInvite();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Only the owner can manage the team',
    });
    expect(createTeamInviteMock).not.toHaveBeenCalled();
  });

  it('returns 201 { ok: true, invite } for a new invite', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'owner-1', email: 'owner@shop.com' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireOwnedBusinessMock.mockResolvedValue({
      ok: true,
      businessId: 'biz',
      userId: 'owner-1',
    });
    createTeamInviteMock.mockResolvedValue({
      ok: true,
      resent: false,
      invite: {
        id: 'inv-1',
        email: 'sam@example.com',
        name: 'Sam Rivera',
        status: 'pending',
      },
      member: {
        id: 'inv-1',
        email: 'sam@example.com',
        status: 'invited',
        source: 'invite',
      },
    });

    const response = await postInvite({
      email: 'sam@example.com',
      name: 'Sam Rivera',
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      resent: false,
      invite: {
        id: 'inv-1',
        email: 'sam@example.com',
        name: 'Sam Rivera',
        status: 'pending',
      },
    });
    expect(createTeamInviteMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        businessId: 'biz',
        invitedBy: 'owner-1',
        ownerEmail: 'owner@shop.com',
        rawEmail: 'sam@example.com',
        name: 'Sam Rivera',
      })
    );
  });

  it('returns 400 when name is blank', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'owner-1', email: 'owner@shop.com' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireOwnedBusinessMock.mockResolvedValue({
      ok: true,
      businessId: 'biz',
      userId: 'owner-1',
    });

    const response = await postInvite({
      email: 'sam@example.com',
      name: '   ',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Enter their name.',
    });
    expect(createTeamInviteMock).not.toHaveBeenCalled();
  });

  it('returns 200 { ok: true, resent: true } when the invite is reused', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'owner-1', email: 'owner@shop.com' },
      supabase: {},
      authMethod: 'cookie',
    });
    requireOwnedBusinessMock.mockResolvedValue({
      ok: true,
      businessId: 'biz',
      userId: 'owner-1',
    });
    createTeamInviteMock.mockResolvedValue({
      ok: true,
      resent: true,
      invite: {
        id: 'inv-1',
        email: 'jose@shop.com',
        name: 'Samantha',
        status: 'pending',
      },
      member: {
        id: 'inv-1',
        email: 'jose@shop.com',
        status: 'invited',
        source: 'invite',
      },
    });

    const response = await postInvite({
      email: 'jose@shop.com',
      name: 'Samantha',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      resent: true,
      invite: {
        id: 'inv-1',
        email: 'jose@shop.com',
        name: 'Samantha',
        status: 'pending',
      },
    });
  });

  it('returns 500 when the email did not send', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'owner-1', email: 'owner@shop.com' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireOwnedBusinessMock.mockResolvedValue({
      ok: true,
      businessId: 'biz',
      userId: 'owner-1',
    });
    createTeamInviteMock.mockResolvedValue({
      ok: false,
      error: 'Could not send invite email',
      status: 500,
    });

    const response = await postInvite();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Could not send invite email',
    });
  });
});
