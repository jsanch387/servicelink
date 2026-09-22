import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadTeamInviteByToken = vi.fn();
const lookupOwnedBusinessId = vi.fn();
const lookupActiveMemberBusinessId = vi.fn();

vi.mock('../server/loadTeamInviteByToken', () => ({
  loadTeamInviteByToken: (...args: unknown[]) => loadTeamInviteByToken(...args),
}));
vi.mock('../server/lookupOwnedBusinessId', () => ({
  lookupOwnedBusinessId: (...args: unknown[]) => lookupOwnedBusinessId(...args),
}));
vi.mock('../server/lookupActiveMemberBusinessId', () => ({
  lookupActiveMemberBusinessId: (...args: unknown[]) =>
    lookupActiveMemberBusinessId(...args),
}));

import { acceptTeamInvite } from '../server/acceptTeamInvite';

function createAdmin(options?: {
  existingMember?: { id: string; status: string } | null;
  insertError?: { message: string } | null;
}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const insert = vi.fn().mockResolvedValue({
    error: options?.insertError ?? null,
  });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options?.existingMember ?? null,
    error: null,
  });

  return {
    from: vi.fn((table: string) => {
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle,
              }),
            }),
          }),
          insert,
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'team_invites') {
        return { update };
      }
      return {};
    }),
  };
}

describe('acceptTeamInvite', () => {
  beforeEach(() => {
    loadTeamInviteByToken.mockReset();
    lookupOwnedBusinessId.mockReset();
    lookupActiveMemberBusinessId.mockReset();
  });

  it('rejects a mismatched email', async () => {
    loadTeamInviteByToken.mockResolvedValue({
      ok: true,
      invite: {
        id: 'inv-1',
        business_id: 'biz-1',
        email: 'alex@shop.com',
      },
      businessName: 'Shop',
    });

    const result = await acceptTeamInvite(createAdmin() as never, {
      rawToken: 'token',
      userId: 'user-1',
      userEmail: 'other@shop.com',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Sign in with alex@shop.com to accept this invite',
      status: 403,
    });
  });

  it('inserts an active member when the invite is valid', async () => {
    loadTeamInviteByToken.mockResolvedValue({
      ok: true,
      invite: {
        id: 'inv-1',
        business_id: 'biz-1',
        email: 'alex@shop.com',
      },
      businessName: 'Shop',
    });
    lookupOwnedBusinessId.mockResolvedValue(null);
    lookupActiveMemberBusinessId.mockResolvedValue(null);

    const admin = createAdmin();
    const result = await acceptTeamInvite(admin as never, {
      rawToken: 'token',
      userId: 'user-1',
      userEmail: 'Alex@Shop.com',
    });

    expect(result).toEqual({
      ok: true,
      businessId: 'biz-1',
      businessName: 'Shop',
    });
    expect(admin.from).toHaveBeenCalledWith('business_members');
  });
});
