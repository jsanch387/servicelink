import { describe, expect, it, vi } from 'vitest';

import { updateTeamMemberRole } from '../server/updateTeamMemberRole';

function createAdmin(options: {
  pendingInviteId?: string | null;
  memberId?: string | null;
  memberUserId?: string | null;
  acceptedInviteId?: string | null;
  memberUpdateError?: { message: string } | null;
  inviteUpdateError?: { message: string } | null;
}) {
  const updates: Array<{ table: string; values: unknown }> = [];

  const update = (table: string) =>
    vi.fn((values: unknown) => {
      updates.push({ table, values });
      const error =
        table === 'business_members'
          ? (options.memberUpdateError ?? null)
          : (options.inviteUpdateError ?? null);
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error }),
        }),
      };
    });

  return {
    updates,
    from: vi.fn((table: string) => {
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.memberId
                      ? { id: options.memberId, user_id: options.memberUserId }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          update: update(table),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: options.pendingInviteId
                    ? { id: options.pendingInviteId }
                    : null,
                  error: null,
                }),
              }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.acceptedInviteId
                      ? { id: options.acceptedInviteId }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        update: update(table),
      };
    }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: 'jordan@example.com' } },
          error: null,
        }),
      },
    },
  };
}

describe('updateTeamMemberRole', () => {
  it('rejects a role the owner cannot assign', async () => {
    const admin = createAdmin({ pendingInviteId: 'inv-1' });
    await expect(
      updateTeamMemberRole(admin as never, {
        businessId: 'biz',
        id: 'inv-1',
        source: 'invite',
        rawRole: 'owner',
      })
    ).resolves.toMatchObject({ ok: false, status: 400 });
    expect(admin.updates).toEqual([]);
  });

  it('updates a pending invite', async () => {
    const admin = createAdmin({ pendingInviteId: 'inv-1' });
    await expect(
      updateTeamMemberRole(admin as never, {
        businessId: 'biz',
        id: 'inv-1',
        source: 'invite',
        rawRole: 'manager',
      })
    ).resolves.toEqual({ ok: true, role: 'manager' });
    expect(admin.updates).toEqual([
      { table: 'team_invites', values: { role: 'manager' } },
    ]);
  });

  it('updates an active member and the invite they accepted', async () => {
    const admin = createAdmin({
      memberId: 'member-1',
      memberUserId: 'user-1',
      acceptedInviteId: 'inv-9',
    });
    await expect(
      updateTeamMemberRole(admin as never, {
        businessId: 'biz',
        id: 'member-1',
        source: 'member',
        rawRole: 'coordinator',
      })
    ).resolves.toEqual({ ok: true, role: 'coordinator' });
    expect(admin.updates).toEqual([
      { table: 'business_members', values: { role: 'coordinator' } },
      { table: 'team_invites', values: { role: 'coordinator' } },
    ]);
  });
});
