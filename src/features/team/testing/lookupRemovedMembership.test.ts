import { describe, expect, it, vi } from 'vitest';

import { lookupRemovedMembership } from '../server/lookupRemovedMembership';

function createAdmin(options: {
  membership?: { business_id: string } | null;
  shop?: { business_name: string } | null;
}) {
  return {
    from: vi.fn((table: string) => {
      const data =
        table === 'business_members'
          ? options.membership === undefined
            ? { business_id: 'biz' }
            : options.membership
          : options.shop === undefined
            ? { business_name: 'Sparkle Mobile' }
            : options.shop;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
                }),
              }),
            }),
            maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
          }),
        }),
      };
    }),
  };
}

describe('lookupRemovedMembership', () => {
  it('returns the last shop that removed this user', async () => {
    await expect(
      lookupRemovedMembership(createAdmin({}) as never, 'user-1')
    ).resolves.toEqual({
      businessId: 'biz',
      businessName: 'Sparkle Mobile',
    });
  });

  it('returns null when they were never removed from a shop', async () => {
    await expect(
      lookupRemovedMembership(
        createAdmin({ membership: null }) as never,
        'user-1'
      )
    ).resolves.toBeNull();
  });
});
