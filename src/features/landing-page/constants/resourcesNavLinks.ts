import { ROUTES } from '@/constants/routes';

export type ResourcesNavItem = {
  label: string;
  href: string;
  description: string;
  icon:
    | 'book'
    | 'calendar'
    | 'compare'
    | 'deposit'
    | 'instagram'
    | 'start'
    | 'workshop';
};

export type ResourcesNavColumn = {
  heading: string;
  items: readonly ResourcesNavItem[];
};

export const RESOURCES_NAV_VIEW_ALL: ResourcesNavItem = {
  label: 'View all guides',
  href: ROUTES.RESOURCES,
  description: 'Free tips to grow your business',
  icon: 'book',
};

/** Featured Resources only — full catalog lives on /resources. */
export const RESOURCES_NAV_COLUMNS: readonly ResourcesNavColumn[] = [
  {
    heading: 'Guides',
    items: [
      {
        label: 'Start a business',
        href: ROUTES.RESOURCE_GUIDE(
          'how-to-start-a-mobile-detailing-business-2026'
        ),
        description: 'Costs, gear, and first clients',
        icon: 'start',
      },
      {
        label: 'Detailing prices',
        href: ROUTES.RESOURCE_GUIDE(
          'how-much-to-charge-for-mobile-detailing-2026'
        ),
        description: 'What to charge in 2026',
        icon: 'deposit',
      },
      {
        label: 'ServiceLink vs Urable',
        href: ROUTES.RESOURCE_GUIDE('servicelink-vs-urable-2026'),
        description: 'Lean booking vs heavy ops',
        icon: 'compare',
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
