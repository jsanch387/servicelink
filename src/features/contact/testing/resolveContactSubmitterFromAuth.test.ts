import type { User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { resolveContactSubmitterFromAuth } from '../server/resolveContactSubmitterFromAuth';

function mockSupabase(
  profile: { full_name?: string | null } | null,
  business: { business_name?: string | null } | null
) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: profile, error: null }),
            }),
          }),
        };
      }
      if (table === 'business_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: business, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as never;
}

function mockUser(
  overrides: Partial<Pick<User, 'id' | 'email' | 'user_metadata'>> = {}
): User {
  return {
    id: 'user-1',
    email: 'owner@example.com',
    user_metadata: { full_name: 'Meta Name' },
    ...overrides,
  } as unknown as User;
}

describe('resolveContactSubmitterFromAuth', () => {
  it('prefers profile full_name over metadata and business name', async () => {
    const supabase = mockSupabase(
      { full_name: 'Profile Name' },
      { business_name: 'Biz LLC' }
    );
    const result = await resolveContactSubmitterFromAuth(supabase, mockUser());
    expect(result).toEqual({
      name: 'Profile Name',
      email: 'owner@example.com',
    });
  });

  it('falls back to business name when profile name is missing', async () => {
    const supabase = mockSupabase(
      { full_name: null },
      { business_name: 'Biz LLC' }
    );
    const result = await resolveContactSubmitterFromAuth(
      supabase,
      mockUser({ user_metadata: {} })
    );
    expect(result).toEqual({
      name: 'Biz LLC',
      email: 'owner@example.com',
    });
  });

  it('returns null when user has no valid email', async () => {
    const supabase = mockSupabase(null, null);
    const result = await resolveContactSubmitterFromAuth(
      supabase,
      mockUser({ email: undefined })
    );
    expect(result).toBeNull();
  });
});
