import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { siteSignupPath } from '@/features/marketing-attribution';
import { landingLiveShopHref } from './landingLiveShops';

export type LandingFeatureTrioLayout = 'split' | 'dashboard';

export interface LandingFeatureTrioCard {
  id: string;
  title: string;
  line: string;
  layout: LandingFeatureTrioLayout;
  bullets: string[];
  shortBullets: string[];
  image: string | null;
  imageAlt: string;
  cta: {
    href: string;
    label: string;
    external?: boolean;
  };
}

export const LANDING_FEATURE_TRIO: LandingFeatureTrioCard[] = [
  {
    id: 'storefront',
    title: 'Your digital storefront',
    line: 'A professional booking page that builds trust and books jobs for you 24/7.',
    layout: 'split',
    bullets: [
      'Services & pricing',
      'Photo gallery',
      'Reviews',
      'Online booking',
      'Deposits',
      'Call / text / email',
    ],
    shortBullets: [
      'Services & pricing',
      'Online booking',
      'Deposits',
      'Reviews',
    ],
    image: MARKETING_IMAGES.features.bookingLink,
    imageAlt: 'Customer booking page',
    cta: {
      href: landingLiveShopHref('blacklabelauto'),
      label: 'View example page',
    },
  },
  {
    id: 'dashboard',
    title: 'Run your business',
    line: 'Manage appointments, quotes, customers, and sales all in one place.',
    layout: 'dashboard',
    bullets: ['Appointments', 'Quotes', 'Customers', 'Sales'],
    shortBullets: ['Appointments', 'Quotes', 'Customers', 'Sales'],
    image: null,
    imageAlt: 'Business dashboard',
    cta: {
      href: siteSignupPath('homepage'),
      label: 'Start free',
    },
  },
  {
    id: 'app',
    title: 'Your mobile office',
    line: 'Manage jobs, send quotes, collect payments, and stay organized on the go.',
    layout: 'split',
    bullets: [
      'Today’s schedule',
      'Customer details',
      'Navigate',
      'Send quotes',
      'Collect payments',
      'Add photos',
    ],
    shortBullets: [
      'Today’s schedule',
      'Send quotes',
      'Collect payments',
      'Navigate',
    ],
    image: MARKETING_IMAGES.features.homeScreen,
    imageAlt: 'ServiceLink mobile home screen',
    cta: {
      href: IOS_APP_STORE_URL,
      label: 'Download app',
      external: true,
    },
  },
];
