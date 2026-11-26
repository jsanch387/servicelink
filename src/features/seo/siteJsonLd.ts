import { SERVICELINK_ONE_LINER } from '@/constants/brandCopy';
import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { MARKETING_SOCIAL } from '@/constants/marketingSocial';
import { ROUTES } from '@/constants/routes';
import {
  PRO_YEARLY_LIST_PRICE,
  TEAM_MONTHLY_LIST_PRICE,
  TEAM_SEAT_LIMIT,
} from '@/features/pricing/types';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

export const SITE_JSON_LD_ID = {
  organization: `${SITE_URL}#organization`,
  software: `${SITE_URL}#software`,
} as const;

export function organizationSameAs(): string[] {
  return [
    MARKETING_SOCIAL.instagramUrl,
    MARKETING_SOCIAL.tiktokUrl,
    IOS_APP_STORE_URL,
    GOOGLE_PLAY_STORE_URL,
  ].filter(Boolean);
}

/** Organization + SoftwareApplication. No ratings or review counts. */
export function buildSiteSoftwareJsonLd() {
  const sameAs = organizationSameAs();

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE_JSON_LD_ID.organization,
    name: 'ServiceLink',
    url: SITE_URL,
    description: SERVICELINK_ONE_LINER,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/google-site-icon.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/brand/google-site-icon.png`,
    sameAs,
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': SITE_JSON_LD_ID.software,
    name: 'ServiceLink',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description: SERVICELINK_ONE_LINER,
    publisher: { '@id': SITE_JSON_LD_ID.organization },
    sameAs,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '60',
      offerCount: 3,
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          url: `${SITE_URL}${ROUTES.PRICING_PAGE}`,
          description:
            '5 lifetime appointments. Booking link stays up. No card required.',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '20',
          priceCurrency: 'USD',
          url: `${SITE_URL}${ROUTES.PRICING_PAGE}`,
          description: `Unlimited bookings, deposits, payments, CRM, SMS updates. ${PRO_YEARLY_LIST_PRICE}/year.`,
        },
        {
          '@type': 'Offer',
          name: 'Team',
          price: '60',
          priceCurrency: 'USD',
          url: `${SITE_URL}${ROUTES.PRICING_PAGE}`,
          description: `${TEAM_MONTHLY_LIST_PRICE}/month for up to ${TEAM_SEAT_LIMIT} people.`,
        },
      ],
    },
  };

  return { organization, software };
}
