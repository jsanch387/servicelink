import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { getFindDetailersCityPath, ROUTES } from '@/constants/routes';
import { MARKETPLACE_CITIES } from '../config/marketplaceCities';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

/** JSON-LD for the marketplace hub landing page. */
export function buildMarketplaceHubJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Find Auto Detailers Near You',
    description:
      'Search trusted mobile and shop auto detailers by city or ZIP. Compare ratings, services, and book online on Service Link.',
    url: `${siteUrl}${ROUTES.FIND_DETAILERS}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Service Link',
      url: siteUrl,
    },
    about: {
      '@type': 'Service',
      name: 'Auto detailing',
      serviceType: 'Auto detailing',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Detailers by city',
      numberOfItems: MARKETPLACE_CITIES.length,
      itemListElement: MARKETPLACE_CITIES.map((city, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `Auto detailers in ${city.displayName}`,
        url: `${siteUrl}${getFindDetailersCityPath(city.slug)}`,
      })),
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${siteUrl}${MARKETING_IMAGES.brand.openGraph}`,
    },
  };
}
