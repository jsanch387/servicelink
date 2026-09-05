import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';

export type ResourcesNavItem = {
  label: string;
  href: string;
  description: string;
  icon:
    | 'book'
    | 'briefcase'
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

export type ResourcesMegaFeatured = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  cta: string;
};

export type ResourcesMegaSection = {
  id: 'guides' | 'learn';
  label: string;
  href: string;
  icon: 'book' | 'workshop';
  links: readonly ResourcesNavItem[];
  featured: ResourcesMegaFeatured;
};

export const RESOURCES_NAV_VIEW_ALL: ResourcesNavItem = {
  label: 'View all guides',
  href: ROUTES.RESOURCES,
  description: 'Free tips to grow your business',
  icon: 'book',
};

const GUIDE_LINKS = [
  {
    label: 'Best Booking App for Mobile Detailers',
    href: ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers'),
    description: 'What to look for and how options stack up',
    icon: 'book',
  },
  {
    label: 'How to Stop No-Shows and Take Deposits',
    href: ROUTES.RESOURCE_GUIDE('stop-no-shows-deposits-mobile-detailing'),
    description: 'Protect your day with deposits',
    icon: 'calendar',
  },
  {
    label: 'ServiceLink vs Detail Connect vs DetailerMade',
    href: ROUTES.RESOURCE_GUIDE(
      'servicelink-vs-detail-connect-vs-detailermade-2026'
    ),
    description: 'Which booking app stays simple day to day',
    icon: 'compare',
  },
  {
    label: 'ServiceLink vs Urable',
    href: ROUTES.RESOURCE_GUIDE('servicelink-vs-urable-2026'),
    description: 'Lean booking vs a heavier ops suite',
    icon: 'briefcase',
  },
  {
    label: 'Jobber Alternative for Mobile Detailers',
    href: ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers'),
    description: 'When a bio link beats a $49 ops suite',
    icon: 'compare',
  },
] as const satisfies readonly ResourcesNavItem[];

const LEARN_LINKS = [
  {
    label: 'Free ads workshop',
    href: ROUTES.WORKSHOP,
    description: 'Local Meta ads that book jobs',
    icon: 'workshop',
  },
  RESOURCES_NAV_VIEW_ALL,
] as const satisfies readonly ResourcesNavItem[];

export const RESOURCES_MEGA_SECTIONS: readonly ResourcesMegaSection[] = [
  {
    id: 'guides',
    label: 'Guides',
    href: ROUTES.RESOURCES,
    icon: 'book',
    links: GUIDE_LINKS,
    featured: {
      eyebrow: 'Featured guide',
      title: 'Best Booking App for Mobile Detailers',
      description: 'What to look for and how to turn your link into more jobs.',
      href: ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers'),
      image: MARKETING_IMAGES.resources.bookingApp,
      imageAlt:
        'Detailer checking a booking app on their phone next to a freshly detailed car',
      cta: 'Read guide',
    },
  },
  {
    id: 'learn',
    label: 'Learn',
    href: ROUTES.WORKSHOP,
    icon: 'workshop',
    links: LEARN_LINKS,
    featured: {
      eyebrow: 'Free workshop',
      title: 'Local Meta ads that book jobs',
      description: 'The $10/day framework detailers use to fill the calendar.',
      href: ROUTES.WORKSHOP,
      image: MARKETING_IMAGES.resources.instagram,
      imageAlt:
        'Phone filming a foam-covered car during a mobile detailing job for social content',
      cta: 'Watch free',
    },
  },
];

/** Featured Resources only — full catalog lives on /resources. */
export const RESOURCES_NAV_COLUMNS: readonly ResourcesNavColumn[] =
  RESOURCES_MEGA_SECTIONS.map(section => ({
    heading: section.label,
    items: section.links,
  }));

/** Flat list for mobile / shared consumers. */
export const RESOURCES_NAV_LINKS: ResourcesNavItem[] =
  RESOURCES_NAV_COLUMNS.flatMap(column => [...column.items]);
