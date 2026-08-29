import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { getPublicBusinessProfilePath } from '@/constants/routes';

export interface LandingLiveShop {
  slug: string;
  name: string;
  city: string;
  image: string;
}

export const LANDING_LIVE_SHOPS: LandingLiveShop[] = [
  {
    slug: 'blacklabelauto',
    name: 'Black Label Detailing',
    city: 'Austin, TX',
    image: MARKETING_IMAGES.shops.blacklabel,
  },
  {
    slug: 'nanobluedetails',
    name: 'Nanoblue Detailing',
    city: 'Naples, FL',
    image: MARKETING_IMAGES.shops.nanoblue,
  },
  {
    slug: 'ridefreshdetailing',
    name: 'Ride Fresh Detailing',
    city: 'Plainfield, NJ',
    image: MARKETING_IMAGES.shops.ridefresh,
  },
  {
    slug: 'apexmobile',
    name: 'Apex Mobile Detailing',
    city: 'Northwest Montana, MT',
    image: MARKETING_IMAGES.shops.apexmobile,
  },
  {
    slug: 'elev8te',
    name: 'Elev8te',
    city: 'Midland, TX',
    image: MARKETING_IMAGES.shops.elev8te,
  },
];

export function landingLiveShopHref(slug: string): string {
  return getPublicBusinessProfilePath(slug);
}
