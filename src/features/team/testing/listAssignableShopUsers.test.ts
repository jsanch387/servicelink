import { describe, expect, it, vi } from 'vitest';

import { listAssignableShopUsers } from '../server/listAssignableShopUsers';

function createAdmin(opts: {
  profileId: string | null;
  members: string[];
  emails: Record<string, string | undefined>;
}) {
  return {
    from: vi.fn((table: string) => {
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
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: opts.members.map(user_id => ({ user_id })),
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
          data: { user: { email: opts.emails[id] } },
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
        label: 'alex@shop.com',
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
