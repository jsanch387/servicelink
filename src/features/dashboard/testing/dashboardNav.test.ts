import { ROUTES } from '@/constants/routes';
import {
  can,
  permissionsForRole,
} from '@/features/team/constants/teamPermissions';
import { describe, expect, it } from 'vitest';
import {
  getDashboardPageTitle,
  getVisibleDashboardNavEntries,
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

  it('groups payments, invoices, and subscriptions under Money', () => {
    const entries = getVisibleDashboardNavEntries({
      hasShopAccess: true,
      showMembershipsNav: true,
      can: ownerCan,
    });
    const money = entries.find(
      entry => entry.kind === 'group' && entry.id === 'money'
    );
    const topLevel = entries
      .filter(entry => entry.kind === 'item')
      .map(entry => entry.item.name);

    expect(money?.kind).toBe('group');
    if (money?.kind !== 'group') return;
    expect(money.items.map(item => item.name)).toEqual([
      'Payments',
      'Invoices',
      'Subscriptions',
    ]);
    expect(money.items.find(item => item.name === 'Subscriptions')?.badge).toBe(
      'beta'
    );
    expect(topLevel).toEqual(['Dashboard', 'Quotes', 'Customers']);
    expect(
      entries.map(entry =>
        entry.kind === 'group' ? entry.name : entry.item.name
      )
    ).toEqual([
      'Dashboard',
      'Shop',
      'Schedule',
      'Quotes',
      'Customers',
      'Money',
    ]);
  });

  it('groups the public pages under Shop and the calendar under Schedule', () => {
    const entries = getVisibleDashboardNavEntries({
      hasShopAccess: true,
      showMembershipsNav: false,
      can: ownerCan,
    });
    const shop = entries.find(
      entry => entry.kind === 'group' && entry.id === 'shop'
    );
    const schedule = entries.find(
      entry => entry.kind === 'group' && entry.id === 'schedule'
    );

    expect(shop?.kind).toBe('group');
    expect(schedule?.kind).toBe('group');
    if (shop?.kind !== 'group' || schedule?.kind !== 'group') return;
    expect(shop.items.map(item => item.name)).toEqual([
      'Booking link',
      'Services',
      'Reviews',
      'Marketing',
    ]);
    expect(schedule.items.map(item => item.name)).toEqual([
      'Bookings',
      'Availability',
    ]);
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
    const items = getVisibleDashboardNavItems({
      hasShopAccess: true,
      showMembershipsNav: false,
      showTeamNav: true,
      can: ownerCan,
    });
    const names = items.map(item => item.name);

    expect(names).toContain('Team');
    expect(names.indexOf('Team')).toBe(names.indexOf('Bookings') + 1);
    expect(names).toContain('Customers');
    expect(items.find(item => item.name === 'Team')?.badge).toBe('new');
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
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.INVOICES)).toBe('Invoices');
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.INVOICES_NEW)).toBe(
      'New invoice'
    );
    expect(
      getDashboardPageTitle(
        ROUTES.DASHBOARD.INVOICE('11111111-1111-4111-8111-111111111111')
      )
    ).toBe('Invoice');
  });

  it('keeps quotes out of Money when subscriptions are hidden', () => {
    const entries = getVisibleDashboardNavEntries({
      hasShopAccess: true,
      showMembershipsNav: false,
      can: ownerCan,
    });
    const money = entries.find(
      entry => entry.kind === 'group' && entry.id === 'money'
    );

    expect(money?.kind).toBe('group');
    if (money?.kind !== 'group') return;
    expect(money.items.map(item => item.name)).toEqual([
      'Payments',
      'Invoices',
    ]);
  });

  it('hides invoices outside the rollout', () => {
    const entries = getVisibleDashboardNavEntries({
      hasShopAccess: true,
      showMembershipsNav: true,
      showInvoicesNav: false,
      can: ownerCan,
    });
    const money = entries.find(
      entry => entry.kind === 'group' && entry.id === 'money'
    );

    expect(money?.kind).toBe('group');
    if (money?.kind !== 'group') return;
    expect(money.items.map(item => item.name)).toEqual([
      'Payments',
      'Subscriptions',
    ]);
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
