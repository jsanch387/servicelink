import { beforeEach, describe, expect, it, vi } from 'vitest';

import { permissionsForRole } from '../constants/teamPermissions';
import { requireDashboardPermission } from '../server/requireDashboardPermission';

const resolveDashboardContext = vi.fn();

vi.mock('../server/resolveDashboardContext', () => ({
  resolveDashboardContext: (...args: unknown[]) =>
    resolveDashboardContext(...args),
}));

describe('requireDashboardPermission', () => {
  beforeEach(() => {
    resolveDashboardContext.mockReset();
  });

  it('passes through auth/business errors', async () => {
    resolveDashboardContext.mockResolvedValue({
      ok: false,
      error: 'Authentication required',
      status: 401,
    });

    await expect(
      requireDashboardPermission({} as never, 'bookings.read')
    ).resolves.toEqual({
      ok: false,
      error: 'Authentication required',
      status: 401,
    });
  });

  it('allows a member to read bookings', async () => {
    const context = {
      userId: 'user-2',
      businessId: 'biz-1',
      isOwner: false,
      role: 'member',
      permissions: permissionsForRole('member'),
    };
    resolveDashboardContext.mockResolvedValue({ ok: true, context });

    await expect(
      requireDashboardPermission({} as never, 'bookings.read')
    ).resolves.toEqual({ ok: true, context });
  });

  it('forbids a member from opening quotes', async () => {
    resolveDashboardContext.mockResolvedValue({
      ok: true,
      context: {
        userId: 'user-2',
        businessId: 'biz-1',
        isOwner: false,
        role: 'member',
        permissions: permissionsForRole('member'),
      },
    });

    await expect(
      requireDashboardPermission({} as never, 'quotes.read')
    ).resolves.toEqual({
      ok: false,
      error: 'Forbidden',
      status: 403,
    });
  });

  it('forbids a member from writing bookings', async () => {
    resolveDashboardContext.mockResolvedValue({
      ok: true,
      context: {
        userId: 'user-2',
        businessId: 'biz-1',
        isOwner: false,
        role: 'member',
        permissions: permissionsForRole('member'),
      },
    });

    await expect(
      requireDashboardPermission({} as never, 'bookings.write')
    ).resolves.toEqual({
      ok: false,
      error: 'Forbidden',
      status: 403,
    });
  });
});
