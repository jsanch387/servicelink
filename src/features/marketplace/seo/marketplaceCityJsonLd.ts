import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { getPublicBusinessProfilePath } from '@/constants/routes';
import type { MarketplaceBusiness } from '../types/marketplace';
import type { MarketplaceCity } from '../config/marketplaceCities';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

export function buildMarketplaceCityItemListJsonLd(input: {
  city: MarketplaceCity;
  cityPath: string;
  businesses: MarketplaceBusiness[];
}) {
  const pageUrl = `${siteUrl}${input.cityPath}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Auto detailers in ${input.city.displayName}`,
    description: `Find and book auto detailing services in ${input.city.displayName}.`,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Service Link',
      url: siteUrl,
    },
    about: {
      '@type': 'City',
      name: input.city.name,
      containedInPlace: {
        '@type': 'State',
        name: input.city.stateCode,
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.businesses.length,
      itemListElement: input.businesses.map((business, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${getPublicBusinessProfilePath(business.slug)}`,
        name: business.name,
        image: business.logoUrl || business.portfolioUrls[0] || undefined,
      })),
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${siteUrl}${MARKETING_IMAGES.brand.openGraph}`,
    },
  };
}
