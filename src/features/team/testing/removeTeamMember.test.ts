import { describe, expect, it, vi } from 'vitest';

import { removeTeamMember } from '../server/removeTeamMember';

function createAdmin(options: {
  source: 'invite' | 'member';
  existing?: { id: string; user_id?: string } | null;
  loadError?: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data:
      options.existing === undefined
        ? { id: 'row-1', user_id: 'user-1' }
        : options.existing,
    error: options.loadError ?? null,
  });
  const bookingUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  });
  const memberUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    }),
  });
  const inviteUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ maybeSingle }),
          then: (
            onFulfilled: (value: { data: null; error: null }) => unknown
          ) => Promise.resolve({ data: null, error: null }).then(onFulfilled),
        }),
      }),
    }),
  });

  const from = vi.fn((table: string) => {
    if (table === 'bookings') {
      return { update: bookingUpdate };
    }
    if (table === 'team_invites') {
      return { update: inviteUpdate };
    }
    return { update: memberUpdate };
  });

  return {
    from,
    bookingUpdate,
    inviteUpdate,
    memberUpdate,
    auth: {
      admin: {
        signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
}

describe('removeTeamMember', () => {
  it('revokes a pending invite without touching bookings', async () => {
    const admin = createAdmin({ source: 'invite', existing: { id: 'inv-1' } });

    await expect(
      removeTeamMember(admin as never, {
        businessId: 'biz',
        id: 'inv-1',
        source: 'invite',
      })
    ).resolves.toEqual({ ok: true });
    expect(admin.bookingUpdate).not.toHaveBeenCalled();
    expect(admin.auth.admin.signOut).not.toHaveBeenCalled();
  });

  it('marks the member removed, frees upcoming jobs, and signs them out', async () => {
    const admin = createAdmin({
      source: 'member',
      existing: { id: 'mem-1', user_id: 'user-1' },
    });

    await expect(
      removeTeamMember(admin as never, {
        businessId: 'biz',
        id: 'mem-1',
        source: 'member',
        asOf: '2026-09-17',
      })
    ).resolves.toEqual({ ok: true });

    expect(admin.inviteUpdate).toHaveBeenCalledWith({ status: 'revoked' });
    expect(admin.bookingUpdate).toHaveBeenCalledWith({
      assigned_user_id: null,
    });
    expect(admin.auth.admin.signOut).toHaveBeenCalledWith('user-1', 'global');
  });

  it('returns 404 when the member is already gone', async () => {
    const admin = createAdmin({ source: 'member', existing: null });

    await expect(
      removeTeamMember(admin as never, {
        businessId: 'biz',
        id: 'missing',
        source: 'member',
      })
    ).resolves.toEqual({
      ok: false,
      error: 'Team member not found',
      status: 404,
    });
    expect(admin.bookingUpdate).not.toHaveBeenCalled();
  });
});
