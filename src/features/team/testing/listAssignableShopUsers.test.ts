import { describe, expect, it, vi } from 'vitest';

import { listAssignableShopUsers } from '../server/listAssignableShopUsers';

function createAdmin(opts: {
  profileId: string | null;
  members: Array<string | { user_id: string; status: string }>;
  emails: Record<string, string | undefined>;
  profiles?: Array<{ user_id: string; full_name: string | null }>;
  metadata?: Record<string, { full_name?: string; name?: string }>;
  invites?: Array<{
    email: string;
    name: string | null;
    accepted_user_id: string | null;
  }>;
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'team_invites') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: opts.invites ?? [],
              error: null,
            }),
          }),
        };
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.profileId ? { profile_id: opts.profileId } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: opts.profiles ?? [],
              error: null,
            }),
          }),
        };
      }
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: opts.members.map(row =>
                  typeof row === 'string'
                    ? { user_id: row, status: 'active' }
                    : row
                ),
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }),
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: {
            user: {
              email: opts.emails[id],
              user_metadata: opts.metadata?.[id] ?? {},
            },
          },
          error: null,
        })),
      },
    },
  };
}

describe('listAssignableShopUsers', () => {
  it('returns the owner then active teammates, skipping invites', async () => {
    const admin = createAdmin({
      profileId: 'owner-1',
      members: ['member-1'],
      emails: {
        'owner-1': 'owner@shop.com',
        'member-1': 'alex@shop.com',
      },
      invites: [
        {
          email: 'alex@shop.com',
          name: 'Alex Rivera',
          accepted_user_id: 'member-1',
        },
      ],
    });

    await expect(
      listAssignableShopUsers(admin as never, 'biz')
    ).resolves.toEqual([
      {
        userId: 'owner-1',
        label: 'owner@shop.com (owner)',
        kind: 'owner',
      },
      {
        userId: 'member-1',
        label: 'Alex Rivera',
        kind: 'member',
      },
    ]);
  });

  it('keeps removed teammates as former labels, not assignable hires', async () => {
    const admin = createAdmin({
      profileId: 'owner-1',
      members: [{ user_id: 'gone-1', status: 'removed' }],
      emails: {
        'owner-1': 'owner@shop.com',
        'gone-1': 'jose@shop.com',
      },
    });

    await expect(
      listAssignableShopUsers(admin as never, 'biz')
    ).resolves.toEqual([
      {
        userId: 'owner-1',
        label: 'owner@shop.com (owner)',
        kind: 'owner',
      },
      {
        userId: 'gone-1',
        label: 'jose@shop.com',
        kind: 'former',
      },
    ]);
  });

  it('uses a saved name instead of the email', async () => {
    const admin = createAdmin({
      profileId: 'owner-1',
      members: ['member-1'],
      emails: {
        'owner-1': 'owner@shop.com',
        'member-1': 'alex@shop.com',
      },
      profiles: [
        { user_id: 'owner-1', full_name: 'Jesus Sanchez' },
        { user_id: 'member-1', full_name: 'Alex Rivera' },
      ],
    });

    await expect(
      listAssignableShopUsers(admin as never, 'biz')
    ).resolves.toEqual([
      {
        userId: 'owner-1',
        label: 'Jesus Sanchez',
        kind: 'owner',
      },
      {
        userId: 'member-1',
        label: 'Alex Rivera',
        kind: 'member',
      },
    ]);
  });

  it('returns an empty list when the shop is missing', async () => {
    const admin = createAdmin({
      profileId: null,
      members: [],
      emails: {},
    });

    await expect(
      listAssignableShopUsers(admin as never, 'missing')
    ).resolves.toEqual([]);
  });
});
