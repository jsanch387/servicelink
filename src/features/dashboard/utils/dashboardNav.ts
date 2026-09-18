import { ROUTES } from '@/constants/routes';
import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import type { TeamPermission } from '@/features/team/constants/teamPermissions';
import {
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  LinkIcon,
  MegaphoneIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type DashboardNavItem = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  requiresOnboarding: boolean;
  requiresMemberships?: boolean;
  requiresAvailability?: boolean;
  requiredPermission?: TeamPermission;
  activePathPrefix?: string;
  badge?: 'beta';
};

const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD.MAIN,
    icon: Squares2X2Icon,
    requiresOnboarding: false,
    requiredPermission: 'dashboard.read',
  },
  {
    name: 'Booking link',
    href: ROUTES.DASHBOARD.BUSINESS_PROFILE,
    icon: LinkIcon,
    requiresOnboarding: true,
    requiredPermission: 'profile.write',
  },
  {
    name: 'Services',
    href: ROUTES.DASHBOARD.SERVICES,
    icon: RectangleStackIcon,
    requiresOnboarding: true,
    requiredPermission: 'services.write',
  },
  {
    name: 'Subscriptions',
    href: ROUTES.DASHBOARD.SUBSCRIPTIONS,
    icon: ArrowPathRoundedSquareIcon,
    requiresOnboarding: true,
    requiresMemberships: true,
    requiredPermission: 'billing.manage',
    badge: 'beta',
    activePathPrefix: '/dashboard/subscriptions',
  },
  {
    name: 'Bookings',
    href: ROUTES.DASHBOARD.BOOKINGS,
    icon: CalendarIcon,
    requiresOnboarding: true,
    requiredPermission: 'bookings.read',
  },
  {
    name: 'Team',
    href: ROUTES.DASHBOARD.TEAM,
    icon: UsersIcon,
    requiresOnboarding: true,
    requiredPermission: 'team.manage',
    activePathPrefix: '/dashboard/team',
  },
  {
    name: 'Reviews',
    href: ROUTES.DASHBOARD.REVIEWS,
    icon: StarIcon,
    requiresOnboarding: true,
    requiredPermission: 'reviews.read',
    activePathPrefix: '/dashboard/reviews',
  },
  {
    name: 'Quotes',
    href: ROUTES.DASHBOARD.QUOTES,
    icon: ClipboardDocumentListIcon,
    requiresOnboarding: true,
    requiredPermission: 'quotes.read',
    activePathPrefix: '/dashboard/quotes',
  },
  {
    name: 'Customers',
    href: ROUTES.DASHBOARD.CUSTOMERS,
    icon: UserGroupIcon,
    requiresOnboarding: true,
    requiredPermission: 'customers.read',
  },
  {
    name: 'Availability',
    href: ROUTES.DASHBOARD.AVAILABILITY,
    icon: ClockIcon,
    requiresOnboarding: true,
    requiresAvailability: true,
    requiredPermission: 'availability.write',
  },
  {
    name: 'Payments',
    href: ROUTES.DASHBOARD.PAYMENTS,
    icon: BanknotesIcon,
    requiresOnboarding: true,
    requiredPermission: 'payments.manage',
    activePathPrefix: '/dashboard/payments',
  },
  {
    name: 'Marketing',
    href: ROUTES.DASHBOARD.MARKETING,
    icon: MegaphoneIcon,
    requiresOnboarding: true,
    requiredPermission: 'marketing.write',
    activePathPrefix: '/dashboard/marketing',
  },
];

export function isDashboardNavItemActive(
  pathname: string,
  item: Pick<DashboardNavItem, 'href' | 'activePathPrefix'>
): boolean {
  if (item.activePathPrefix) {
    return (
      pathname === item.href ||
      pathname === item.activePathPrefix ||
      pathname.startsWith(`${item.activePathPrefix}/`)
    );
  }
  return pathname === item.href;
}

export function getVisibleDashboardNavItems({
  hasShopAccess,
  showMembershipsNav,
  can,
}: {
  hasShopAccess: boolean;
  showMembershipsNav: boolean;
  can: (permission: TeamPermission) => boolean;
}): DashboardNavItem[] {
  return DASHBOARD_NAV_ITEMS.filter(item => {
    if (item.requiresOnboarding && !hasShopAccess) return false;
    if (item.requiresMemberships && !showMembershipsNav) return false;
    if (item.requiresAvailability && !AVAILABILITY_FEATURE_ENABLED)
      return false;
    if (item.requiredPermission && !can(item.requiredPermission)) return false;
    return true;
  });
}

export function getDashboardPageTitle(pathname: string): string | null {
  if (pathname === ROUTES.DASHBOARD.SETTINGS) return 'Settings';
  if (pathname === ROUTES.DASHBOARD.CONTACT) return 'Help';
  if (pathname.startsWith(`${ROUTES.DASHBOARD.UPGRADE}`)) return 'Upgrade';
  if (pathname === ROUTES.DASHBOARD.PAYMENTS) return 'Revenue';
  if (pathname.startsWith(ROUTES.DASHBOARD.PAYMENTS_TRANSACTIONS)) {
    return 'Transactions';
  }
  if (pathname.startsWith(ROUTES.DASHBOARD.PAYMENTS_FEES)) {
    return 'Stripe fees';
  }
  if (pathname.startsWith(ROUTES.DASHBOARD.PAYMENTS_SETTINGS)) {
    return 'Payment settings';
  }

  const match = DASHBOARD_NAV_ITEMS.find(item =>
    isDashboardNavItemActive(pathname, item)
  );
  return match?.name ?? null;
}
