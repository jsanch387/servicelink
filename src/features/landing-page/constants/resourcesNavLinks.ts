import { ROUTES } from '@/constants/routes';

export const RESOURCES_NAV_LINKS = [
  {
    label: 'Guides & articles',
    href: ROUTES.RESOURCES,
    description: 'Free tips to grow your service business',
  },
  {
    label: 'Free ads workshop',
    href: ROUTES.WORKSHOP_RUN_ADS,
    description: 'How to run local Meta ads that book jobs',
  },
] as const;
