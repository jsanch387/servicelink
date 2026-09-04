import { ROUTES } from '@/constants/routes';
import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
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
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type DashboardNavGroupId = 'home' | 'workspace' | 'grow';

export type DashboardNavItem = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  group: DashboardNavGroupId;
  requiresOnboarding: boolean;
  requiresMemberships?: boolean;
  requiresAvailability?: boolean;
  activePathPrefix?: string;
  badge?: 'beta';
};

export const DASHBOARD_NAV_GROUP_LABEL: Record<
  Exclude<DashboardNavGroupId, 'home'>,
  string
> = {
  workspace: 'Workspace',
  grow: 'Grow',
};

const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD.MAIN,
    icon: Squares2X2Icon,
    group: 'home',
    requiresOnboarding: false,
  },
  {
    name: 'Booking link',
    href: ROUTES.DASHBOARD.BUSINESS_PROFILE,
    icon: LinkIcon,
    group: 'workspace',
    requiresOnboarding: true,
  },
  {
    name: 'Services',
    href: ROUTES.DASHBOARD.SERVICES,
    icon: RectangleStackIcon,
    group: 'workspace',
    requiresOnboarding: true,
  },
  {
    name: 'Subscriptions',
    href: ROUTES.DASHBOARD.SUBSCRIPTIONS,
    icon: ArrowPathRoundedSquareIcon,
    group: 'workspace',
    requiresOnboarding: true,
    requiresMemberships: true,
    badge: 'beta',
    activePathPrefix: '/dashboard/subscriptions',
  },
  {
    name: 'Bookings',
    href: ROUTES.DASHBOARD.BOOKINGS,
    icon: CalendarIcon,
    group: 'workspace',
    requiresOnboarding: true,
  },
  {
    name: 'Reviews',
    href: ROUTES.DASHBOARD.REVIEWS,
    icon: StarIcon,
    group: 'workspace',
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/reviews',
  },
  {
    name: 'Quotes',
    href: ROUTES.DASHBOARD.QUOTES,
    icon: ClipboardDocumentListIcon,
    group: 'workspace',
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/quotes',
  },
  {
    name: 'Customers',
    href: ROUTES.DASHBOARD.CUSTOMERS,
    icon: UserGroupIcon,
    group: 'workspace',
    requiresOnboarding: true,
  },
  {
    name: 'Availability',
    href: ROUTES.DASHBOARD.AVAILABILITY,
    icon: ClockIcon,
    group: 'workspace',
    requiresOnboarding: true,
    requiresAvailability: true,
  },
  {
    name: 'Payments',
    href: ROUTES.DASHBOARD.PAYMENTS,
    icon: BanknotesIcon,
    group: 'grow',
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/payments',
  },
  {
    name: 'Marketing',
    href: ROUTES.DASHBOARD.MARKETING,
    icon: MegaphoneIcon,
    group: 'grow',
    requiresOnboarding: true,
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
  isOnboardingCompleted,
  showMembershipsNav,
}: {
  isOnboardingCompleted: boolean;
  showMembershipsNav: boolean;
}): DashboardNavItem[] {
  return DASHBOARD_NAV_ITEMS.filter(item => {
    if (item.requiresOnboarding && !isOnboardingCompleted) return false;
    if (item.requiresMemberships && !showMembershipsNav) return false;
    if (item.requiresAvailability && !AVAILABILITY_FEATURE_ENABLED)
      return false;
    return true;
  });
}

export type DashboardNavGroup = {
  id: DashboardNavGroupId;
  label: string | null;
  items: DashboardNavItem[];
};

const GROUP_ORDER: DashboardNavGroupId[] = ['home', 'workspace', 'grow'];

export function getVisibleDashboardNavGroups(options: {
  isOnboardingCompleted: boolean;
  showMembershipsNav: boolean;
}): DashboardNavGroup[] {
  const items = getVisibleDashboardNavItems(options);
  return GROUP_ORDER.flatMap(id => {
    const groupItems = items.filter(item => item.group === id);
    if (groupItems.length === 0) return [];
    return [
      {
        id,
        label: id === 'home' ? null : DASHBOARD_NAV_GROUP_LABEL[id],
        items: groupItems,
      },
    ];
  });
}

export function getDashboardPageTitle(pathname: string): string | null {
  if (pathname === ROUTES.DASHBOARD.SETTINGS) return 'Settings';
  if (pathname === ROUTES.DASHBOARD.CONTACT) return 'Contact';
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
