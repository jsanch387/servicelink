import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';

const lookupOwnedBusinessId = vi.fn();
const lookupActiveMemberBusinessId = vi.fn();

vi.mock('@/features/team', () => ({
  lookupOwnedBusinessId: (...args: unknown[]) => lookupOwnedBusinessId(...args),
  lookupActiveMemberBusinessId: (...args: unknown[]) =>
    lookupActiveMemberBusinessId(...args),
}));

function createAuthClient(user: { id: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'unauthenticated' },
      }),
    },
  };
}

describe('resolveCurrentBusinessId', () => {
  beforeEach(() => {
    lookupOwnedBusinessId.mockReset();
    lookupActiveMemberBusinessId.mockReset();
  });

  it('returns 401 when there is no signed-in user', async () => {
    const result = await resolveCurrentBusinessId(
      createAuthClient(null) as never
    );

    expect(result).toEqual({
      ok: false,
      error: 'Authentication required',
      status: 401,
    });
    expect(lookupOwnedBusinessId).not.toHaveBeenCalled();
  });

  it('returns the owned business without checking membership', async () => {
    lookupOwnedBusinessId.mockResolvedValue('biz-owned');

    const result = await resolveCurrentBusinessId(
      createAuthClient({ id: 'user-1' }) as never
    );

    expect(result).toEqual({ ok: true, businessId: 'biz-owned' });
    expect(lookupActiveMemberBusinessId).not.toHaveBeenCalled();
  });

  it('falls back to an active team membership', async () => {
    lookupOwnedBusinessId.mockResolvedValue(null);
    lookupActiveMemberBusinessId.mockResolvedValue('biz-member');

    const result = await resolveCurrentBusinessId(
      createAuthClient({ id: 'user-2' }) as never
    );

    expect(result).toEqual({ ok: true, businessId: 'biz-member' });
  });

  it('returns 404 when the user owns nothing and is not a member', async () => {
    lookupOwnedBusinessId.mockResolvedValue(null);
    lookupActiveMemberBusinessId.mockResolvedValue(null);

    const result = await resolveCurrentBusinessId(
      createAuthClient({ id: 'user-3' }) as never
    );

    expect(result).toEqual({
      ok: false,
      error: 'Business profile not found',
      status: 404,
    });
  });
});
