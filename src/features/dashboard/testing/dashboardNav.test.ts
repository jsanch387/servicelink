import { ROUTES } from '@/constants/routes';
import {
  can,
  permissionsForRole,
} from '@/features/team/constants/teamPermissions';
import { describe, expect, it } from 'vitest';
import {
  getDashboardPageTitle,
  getVisibleDashboardNavItems,
  isDashboardNavItemActive,
} from '../utils/dashboardNav';

const ownerCan = (permission: Parameters<typeof can>[1]) =>
  can({ isOwner: true, permissions: permissionsForRole('owner') }, permission);

const memberCan = (permission: Parameters<typeof can>[1]) =>
  can(
    { isOwner: false, permissions: permissionsForRole('member') },
    permission
  );

describe('isDashboardNavItemActive', () => {
  it('matches an exact href', () => {
    expect(
      isDashboardNavItemActive('/dashboard', { href: ROUTES.DASHBOARD.MAIN })
    ).toBe(true);
  });

  it('does not treat nested routes as the dashboard home', () => {
    expect(
      isDashboardNavItemActive('/dashboard/bookings', {
        href: ROUTES.DASHBOARD.MAIN,
      })
    ).toBe(false);
  });

  it('matches a prefix for nested pages', () => {
    expect(
      isDashboardNavItemActive('/dashboard/quotes/requests', {
        href: ROUTES.DASHBOARD.QUOTES,
        activePathPrefix: '/dashboard/quotes',
      })
    ).toBe(true);
  });
});

describe('getVisibleDashboardNavItems', () => {
  it('hides onboarding-only items before setup is done', () => {
    const items = getVisibleDashboardNavItems({
      hasShopAccess: false,
      showMembershipsNav: false,
      can: ownerCan,
    });
    expect(items.map(item => item.name)).toEqual(['Dashboard']);
  });

  it('shows the job board only for an active member', () => {
    const names = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: true,
      can: memberCan,
    }).map(item => item.name);

    expect(names).toEqual(['Dashboard', 'Bookings']);
  });

  it('inserts subscriptions after services when allowlisted', () => {
    const items = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: true,
      can: ownerCan,
    });
    const names = items.map(item => item.name);
    const subscriptions = items.find(item => item.name === 'Subscriptions');

    expect(names.indexOf('Subscriptions')).toBe(names.indexOf('Services') + 1);
    expect(subscriptions?.badge).toBe('beta');
  });

  it('omits subscriptions when not allowlisted', () => {
    const names = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: false,
      can: ownerCan,
    }).map(item => item.name);

    expect(names).not.toContain('Subscriptions');
  });

  it('puts Team in the main nav for the owner, after Bookings', () => {
    const names = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: false,
      showTeamNav: true,
      can: ownerCan,
    }).map(item => item.name);

    expect(names).toContain('Team');
    expect(names.indexOf('Team')).toBe(names.indexOf('Bookings') + 1);
    expect(names).toContain('Customers');
  });

  it('hides Team when the rollout flag is off', () => {
    const names = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: false,
      showTeamNav: false,
      can: ownerCan,
    }).map(item => item.name);

    expect(names).not.toContain('Team');
  });
});

describe('getDashboardPageTitle', () => {
  it('returns the matching nav label', () => {
    expect(getDashboardPageTitle('/dashboard/bookings')).toBe('Bookings');
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.TEAM)).toBe('Team');
  });

  it('returns Settings for the settings route', () => {
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.SETTINGS)).toBe('Settings');
  });

  it('returns Help for the contact route', () => {
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.CONTACT)).toBe('Help');
  });

  it('names payments sub-screens', () => {
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.PAYMENTS)).toBe('Revenue');
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.PAYMENTS_TRANSACTIONS)).toBe(
      'Transactions'
    );
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.PAYMENTS_SETTINGS)).toBe(
      'Payment settings'
    );
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.PAYMENTS_FEES)).toBe(
      'Stripe fees'
    );
  });
});
