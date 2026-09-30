import { ROUTES } from '@/constants/routes';
import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import type { TeamPermission } from '@/features/team/constants/teamPermissions';
import {
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
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
  requiresTeamRollout?: boolean;
  requiresAvailability?: boolean;
  requiredPermission?: TeamPermission;
  activePathPrefix?: string;
  badge?: 'beta' | 'new';
  /** Collapsible side-nav group. Omitted items stay as their own row. */
  navGroup?: 'shop' | 'schedule' | 'money';
};

export type DashboardNavGroupId = 'shop' | 'schedule' | 'money';

export type DashboardNavEntry =
  | { kind: 'item'; item: DashboardNavItem }
  | {
      kind: 'group';
      id: DashboardNavGroupId;
      name: string;
      icon: ComponentType<SVGProps<SVGSVGElement>>;
      items: DashboardNavItem[];
    };

const NAV_GROUPS: readonly {
  id: DashboardNavGroupId;
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: readonly string[];
  /** `end` keeps Money at the bottom instead of where its first child sits. */
  place: 'first' | 'end';
}[] = [
  {
    id: 'shop',
    name: 'Shop',
    icon: BuildingStorefrontIcon,
    children: ['Booking link', 'Services', 'Reviews', 'Marketing'],
    place: 'first',
  },
  {
    id: 'schedule',
    name: 'Schedule',
    icon: CalendarDaysIcon,
    children: ['Bookings', 'Availability'],
    place: 'first',
  },
  {
    id: 'money',
    name: 'Money',
    icon: CreditCardIcon,
    children: ['Payments', 'Invoices', 'Subscriptions'],
    place: 'end',
  },
];

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
    navGroup: 'shop',
  },
  {
    name: 'Services',
    href: ROUTES.DASHBOARD.SERVICES,
    icon: RectangleStackIcon,
    requiresOnboarding: true,
    requiredPermission: 'services.write',
    navGroup: 'shop',
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
    navGroup: 'money',
  },
  {
    name: 'Bookings',
    href: ROUTES.DASHBOARD.BOOKINGS,
    icon: CalendarIcon,
    requiresOnboarding: true,
    requiredPermission: 'bookings.read',
    navGroup: 'schedule',
  },
  {
    name: 'Team',
    href: ROUTES.DASHBOARD.TEAM,
    icon: UsersIcon,
    requiresOnboarding: true,
    requiredPermission: 'team.manage',
    requiresTeamRollout: true,
    badge: 'new',
    activePathPrefix: '/dashboard/team',
  },
  {
    name: 'Reviews',
    href: ROUTES.DASHBOARD.REVIEWS,
    icon: StarIcon,
    requiresOnboarding: true,
    requiredPermission: 'reviews.read',
    activePathPrefix: '/dashboard/reviews',
    navGroup: 'shop',
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
    name: 'Invoices',
    href: ROUTES.DASHBOARD.INVOICES,
    icon: DocumentTextIcon,
    requiresOnboarding: true,
    requiredPermission: 'invoices.read',
    activePathPrefix: '/dashboard/invoices',
    badge: 'new',
    navGroup: 'money',
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
    navGroup: 'schedule',
  },
  {
    name: 'Payments',
    href: ROUTES.DASHBOARD.PAYMENTS,
    icon: BanknotesIcon,
    requiresOnboarding: true,
    requiredPermission: 'payments.manage',
    activePathPrefix: '/dashboard/payments',
    navGroup: 'money',
  },
  {
    name: 'Marketing',
    href: ROUTES.DASHBOARD.MARKETING,
    icon: MegaphoneIcon,
    requiresOnboarding: true,
    requiredPermission: 'marketing.write',
    activePathPrefix: '/dashboard/marketing',
    navGroup: 'shop',
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
  showTeamNav = false,
  can,
}: {
  hasShopAccess: boolean;
  showMembershipsNav: boolean;
  showTeamNav?: boolean;
  can: (permission: TeamPermission) => boolean;
}): DashboardNavItem[] {
  return DASHBOARD_NAV_ITEMS.filter(item => {
    if (item.requiresOnboarding && !hasShopAccess) return false;
    if (item.requiresMemberships && !showMembershipsNav) return false;
    if (item.requiresTeamRollout && !showTeamNav) return false;
    if (item.requiresAvailability && !AVAILABILITY_FEATURE_ENABLED)
      return false;
    if (item.requiredPermission && !can(item.requiredPermission)) return false;
    return true;
  });
}

/** Side nav rows. Related pages sit in Shop, Schedule, and Money. */
export function getVisibleDashboardNavEntries(args: {
  hasShopAccess: boolean;
  showMembershipsNav: boolean;
  showTeamNav?: boolean;
  can: (permission: TeamPermission) => boolean;
}): DashboardNavEntry[] {
  const visible = getVisibleDashboardNavItems(args);
  const groups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.children.flatMap(name => {
      const item = visible.find(
        entry => entry.navGroup === group.id && entry.name === name
      );
      return item ? [item] : [];
    }),
  })).map(group => ({
    ...group,
    asGroup: group.items.length > 1,
  }));

  const emitted = new Set<DashboardNavGroupId>();
  const entries: DashboardNavEntry[] = [];

  const pushGroup = (id: DashboardNavGroupId) => {
    const group = groups.find(entry => entry.id === id);
    if (!group?.asGroup || emitted.has(id)) return;
    emitted.add(id);
    entries.push({
      kind: 'group',
      id: group.id,
      name: group.name,
      icon: group.icon,
      items: group.items,
    });
  };

  for (const item of visible) {
    const group = groups.find(entry =>
      entry.items.some(child => child.name === item.name)
    );
    if (group?.asGroup) {
      if (group.place === 'first') pushGroup(group.id);
      continue;
    }
    entries.push({ kind: 'item', item });
  }

  for (const group of groups) {
    if (group.place === 'end') pushGroup(group.id);
  }

  return entries;
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
  if (pathname === ROUTES.DASHBOARD.INVOICES_NEW) return 'New invoice';
  if (pathname.startsWith(`${ROUTES.DASHBOARD.INVOICES}/`)) return 'Invoice';

  const match = DASHBOARD_NAV_ITEMS.find(item =>
    isDashboardNavItemActive(pathname, item)
  );
  return match?.name ?? null;
}
