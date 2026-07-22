import { ROUTES } from '@/constants/routes';

export type ResourcesNavItem = {
  label: string;
  href: string;
  description: string;
  icon: 'book' | 'calendar' | 'deposit' | 'instagram' | 'workshop';
};

export type ResourcesNavColumn = {
  heading: string;
  items: readonly ResourcesNavItem[];
};

/** Column-based Resources menu — keep items short and scannable. */
export const RESOURCES_NAV_COLUMNS: readonly ResourcesNavColumn[] = [
  {
    heading: 'Guides',
    items: [
      {
        label: 'All guides',
        href: ROUTES.RESOURCES,
        description: 'Free tips to grow your business',
        icon: 'book',
      },
      {
        label: 'Best booking app',
        href: ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers'),
        description: 'What to look for as a detailer',
        icon: 'calendar',
      },
      {
        label: 'Stop no-shows',
        href: ROUTES.RESOURCE_GUIDE('stop-no-shows-deposits-mobile-detailing'),
        description: 'Deposits and cancellation policy',
        icon: 'deposit',
      },
      {
        label: 'Instagram clients',
        href: ROUTES.RESOURCE_GUIDE(
          'how-mobile-detailers-get-clients-from-instagram-2026'
        ),
        description: 'Turn views into bookings',
        icon: 'instagram',
      },
    ],
  },
  {
    heading: 'Learn',
    items: [
      {
        label: 'Free ads workshop',
        href: ROUTES.WORKSHOP,
        description: 'Local Meta ads that book jobs',
        icon: 'workshop',
      },
    ],
  },
];

/** Flat list for mobile / shared consumers. */
export const RESOURCES_NAV_LINKS: ResourcesNavItem[] =
  RESOURCES_NAV_COLUMNS.flatMap(column => [...column.items]);
