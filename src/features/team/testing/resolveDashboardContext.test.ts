import { beforeEach, describe, expect, it, vi } from 'vitest';

import { permissionsForRole } from '../constants/teamPermissions';
import { resolveDashboardContext } from '../server/resolveDashboardContext';

const lookupOwnedBusinessId = vi.fn();
const lookupActiveMembership = vi.fn();

vi.mock('../server/lookupOwnedBusinessId', () => ({
  lookupOwnedBusinessId: (...args: unknown[]) =>
    lookupOwnedBusinessId(...args),
}));

vi.mock('../server/lookupActiveMembership', () => ({
  lookupActiveMembership: (...args: unknown[]) =>
    lookupActiveMembership(...args),
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

describe('resolveDashboardContext', () => {
  beforeEach(() => {
    lookupOwnedBusinessId.mockReset();
    lookupActiveMembership.mockReset();
  });

  it('returns 401 when there is no signed-in user', async () => {
    const result = await resolveDashboardContext(
      createAuthClient(null) as never
    );

    expect(result).toEqual({
      ok: false,
      error: 'Authentication required',
      status: 401,
    });
  });

  it('returns the owned shop as owner without checking membership', async () => {
    lookupOwnedBusinessId.mockResolvedValue('biz-owned');

    const result = await resolveDashboardContext(
      createAuthClient({ id: 'user-1' }) as never
    );

    expect(result).toEqual({
      ok: true,
      context: {
        userId: 'user-1',
        businessId: 'biz-owned',
        isOwner: true,
        role: 'owner',
        permissions: permissionsForRole('owner'),
      },
    });
    expect(lookupActiveMembership).not.toHaveBeenCalled();
  });

  it('falls back to an active membership as member', async () => {
    lookupOwnedBusinessId.mockResolvedValue(null);
    lookupActiveMembership.mockResolvedValue({
      businessId: 'biz-member',
      role: 'member',
    });

    const result = await resolveDashboardContext(
      createAuthClient({ id: 'user-2' }) as never
    );

    expect(result).toEqual({
      ok: true,
      context: {
        userId: 'user-2',
        businessId: 'biz-member',
        isOwner: false,
        role: 'member',
        permissions: permissionsForRole('member'),
      },
    });
  });

  it('maps an unknown assigned role to member', async () => {
    lookupOwnedBusinessId.mockResolvedValue(null);
    lookupActiveMembership.mockResolvedValue({
      businessId: 'biz-member',
      role: 'helper',
    });

    const result = await resolveDashboardContext(
      createAuthClient({ id: 'user-2' }) as never
    );

    expect(result).toMatchObject({
      ok: true,
      context: { role: 'member', isOwner: false },
    });
  });
});
