import { describe, expect, it, vi } from 'vitest';

import { updateTeamMemberName } from '../server/updateTeamMemberName';

function createAdmin(options: {
  inviteId?: string | null;
  memberUserId?: string | null;
  acceptedInviteId?: string | null;
  updateError?: { message: string } | null;
}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: options.updateError ?? null,
      }),
    }),
  });

  return {
    update,
    from: vi.fn((table: string) => {
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.memberUserId
                      ? { user_id: options.memberUserId }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: options.inviteId ? { id: options.inviteId } : null,
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
        update,
      };
    }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: 'jose@shop.com' } },
          error: null,
        }),
      },
    },
  };
}

describe('updateTeamMemberName', () => {
  it('rejects a blank name', async () => {
    const admin = createAdmin({ inviteId: 'inv-1' });
    await expect(
      updateTeamMemberName(admin as never, {
        businessId: 'biz',
        id: 'inv-1',
        source: 'invite',
        rawName: '   ',
      })
    ).resolves.toEqual({
      ok: false,
      error: 'Enter their name.',
      status: 400,
    });
    expect(admin.update).not.toHaveBeenCalled();
  });

  it('updates a pending invite by id', async () => {
    const admin = createAdmin({ inviteId: 'inv-1' });
    await expect(
      updateTeamMemberName(admin as never, {
        businessId: 'biz',
        id: 'inv-1',
        source: 'invite',
        rawName: '  Jose  ',
      })
    ).resolves.toEqual({ ok: true, name: 'Jose' });
    expect(admin.update).toHaveBeenCalledWith({ name: 'Jose' });
  });

  it('updates an active member via their accepted invite', async () => {
    const admin = createAdmin({
      memberUserId: 'user-1',
      acceptedInviteId: 'inv-9',
    });
    await expect(
      updateTeamMemberName(admin as never, {
        businessId: 'biz',
        id: 'member-1',
        source: 'member',
        rawName: 'Alex Rivera',
      })
    ).resolves.toEqual({ ok: true, name: 'Alex Rivera' });
    expect(admin.update).toHaveBeenCalledWith({ name: 'Alex Rivera' });
  });
});
