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
    expect(can({ isOwner: true, permissions: [] }, 'billing.manage')).toBe(
      true
    );
    expect(can({ isOwner: true, permissions: [] }, 'bookings.write')).toBe(
      true
    );
  });

  it('gives members the job board only', () => {
    const permissions = permissionsForRole('member');

    expect(can({ isOwner: false, permissions }, 'dashboard.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.run')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'quotes.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'invoices.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'expenses.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'expenses.write')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'reviews.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'customers.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'bookings.delete')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'payments.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
  });

  it('lets a coordinator schedule without owner locks', () => {
    const permissions = permissionsForRole('coordinator');

    expect(can({ isOwner: false, permissions }, 'bookings.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.run')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.delete')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'customers.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'payments.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'account.delete')).toBe(false);
  });

  it('defines manager as shop operator without owner-only keys', () => {
    const permissions = permissionsForRole('manager');

    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.delete')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'profile.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'customers.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'expenses.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'expenses.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'billing.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'payments.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'account.delete')).toBe(false);
  });

  it('narrows permission and role strings', () => {
    expect(isTeamPermission('bookings.read')).toBe(true);
    expect(isTeamPermission('bookings.admin')).toBe(false);
    expect(isDashboardAccessRole('member')).toBe(true);
    expect(isDashboardAccessRole('coordinator')).toBe(true);
    expect(isDashboardAccessRole('manager')).toBe(true);
    expect(isDashboardAccessRole('admin')).toBe(false);
    expect(permissionsForRole('owner')).toEqual([...TEAM_PERMISSIONS]);
  });

  it('keeps each hired role inside its bundle', () => {
    const ownerLocks = [
      'billing.manage',
      'payments.manage',
      'team.manage',
      'account.delete',
    ] as const;
    const office = [
      'customers.read',
      'customers.write',
      'quotes.read',
      'quotes.write',
      'invoices.read',
      'invoices.write',
      'expenses.read',
      'expenses.write',
      'reviews.read',
      'reviews.write',
      'profile.write',
      'services.write',
      'availability.write',
      'marketing.write',
    ] as const;

    for (const role of ['member', 'coordinator', 'manager'] as const) {
      const permissions = permissionsForRole(role);
      for (const lock of ownerLocks) {
        expect(can({ isOwner: false, permissions }, lock), role).toBe(false);
      }
    }

    const member = permissionsForRole('member');
    expect(can({ isOwner: false, permissions: member }, 'bookings.run')).toBe(
      true
    );
    expect(can({ isOwner: false, permissions: member }, 'bookings.write')).toBe(
      false
    );
    for (const permission of office) {
      expect(can({ isOwner: false, permissions: member }, permission)).toBe(
        false
      );
    }

    const coordinator = permissionsForRole('coordinator');
    expect(
      can({ isOwner: false, permissions: coordinator }, 'bookings.write')
    ).toBe(true);
    expect(
      can({ isOwner: false, permissions: coordinator }, 'bookings.delete')
    ).toBe(true);
    for (const permission of office) {
      expect(
        can({ isOwner: false, permissions: coordinator }, permission)
      ).toBe(false);
    }

    const manager = permissionsForRole('manager');
    for (const permission of office) {
      expect(can({ isOwner: false, permissions: manager }, permission)).toBe(
        true
      );
    }
    expect(can({ isOwner: false, permissions: manager }, 'bookings.run')).toBe(
      true
    );
  });
});
