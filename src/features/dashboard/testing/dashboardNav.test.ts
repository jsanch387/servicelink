import { ROUTES } from '@/constants/routes';
import { describe, expect, it } from 'vitest';
import {
  getDashboardPageTitle,
  getVisibleDashboardNavItems,
  isDashboardNavItemActive,
} from '../utils/dashboardNav';

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
      isOnboardingCompleted: false,
      showMembershipsNav: false,
    });
    expect(items.map(item => item.name)).toEqual(['Dashboard']);
  });

  it('inserts subscriptions after services when allowlisted', () => {
    const names = getVisibleDashboardNavItems({
      isOnboardingCompleted: true,
      showMembershipsNav: true,
    }).map(item => item.name);

    expect(names.indexOf('Subscriptions')).toBe(names.indexOf('Services') + 1);
  });

  it('omits subscriptions when not allowlisted', () => {
    const names = getVisibleDashboardNavItems({
      isOnboardingCompleted: true,
      showMembershipsNav: false,
    }).map(item => item.name);

    expect(names).not.toContain('Subscriptions');
  });
});

describe('getDashboardPageTitle', () => {
  it('returns the matching nav label', () => {
    expect(getDashboardPageTitle('/dashboard/bookings')).toBe('Bookings');
  });

  it('returns Settings for the settings route', () => {
    expect(getDashboardPageTitle(ROUTES.DASHBOARD.SETTINGS)).toBe('Settings');
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
