import { describe, expect, it } from 'vitest';

import {
  can,
  isDashboardAccessRole,
  isTeamPermission,
  permissionsForRole,
  TEAM_PERMISSIONS,
} from '../constants/teamPermissions';

describe('teamPermissions', () => {
  it('treats the owner as having every permission', () => {
    expect(
      can({ isOwner: true, permissions: [] }, 'billing.manage')
    ).toBe(true);
    expect(
      can({ isOwner: true, permissions: [] }, 'bookings.write')
    ).toBe(true);
  });

  it('gives members work reads only', () => {
    const permissions = permissionsForRole('member');

    expect(can({ isOwner: false, permissions }, 'bookings.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.run')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'quotes.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'payments.manage')).toBe(
      false
    );
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
  });

  it('defines manager as shop operator without owner-only keys', () => {
    const permissions = permissionsForRole('manager');

    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'profile.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'billing.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'account.delete')).toBe(false);
  });

  it('narrows permission and role strings', () => {
    expect(isTeamPermission('bookings.read')).toBe(true);
    expect(isTeamPermission('bookings.admin')).toBe(false);
    expect(isDashboardAccessRole('member')).toBe(true);
    expect(isDashboardAccessRole('admin')).toBe(false);
    expect(permissionsForRole('owner')).toEqual([...TEAM_PERMISSIONS]);
  });
});
