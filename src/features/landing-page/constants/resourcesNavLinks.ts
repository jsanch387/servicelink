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
    label: 'Best Booking Apps and CRMs (2026)',
    href: ROUTES.RESOURCE_GUIDE(
      'best-booking-apps-and-crms-for-mobile-detailers'
    ),
    description: 'ServiceLink vs Jobber, Square, Urable, and more',
    icon: 'book',
  },
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
    label: 'Jobber Alternative for Mobile Detailers',
    href: ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers'),
    description: 'When a bio link beats a field-service suite',
    icon: 'compare',
  },
  {
    label: 'DetailDeck Alternative for Mobile Detailers',
    href: ROUTES.RESOURCE_GUIDE('servicelink-vs-detaildeck'),
    description: 'Which bio-link booking app fits a one-truck shop',
    icon: 'compare',
  },
  {
    label: 'Urable Alternative for Mobile Detailers',
    href: ROUTES.RESOURCE_GUIDE('servicelink-vs-urable'),
    description: 'Lean booking vs a heavier ops suite',
    icon: 'briefcase',
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
      title: 'Best CRM for Mobile Detailers',
      description:
        'Booking, deposits, and client lists compared—without a field-service suite.',
      href: ROUTES.RESOURCE_GUIDE('best-crm-for-mobile-detailers'),
      image: MARKETING_IMAGES.resources.crm,
      imageAlt:
        'Detailer holding a phone with a client list in front of a closed silver sedan',
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
