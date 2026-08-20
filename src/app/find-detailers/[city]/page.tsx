import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import {
  MARKETPLACE_CITIES,
  marketplaceCityDescription,
  marketplaceCityTitle,
} from '@/features/marketplace/config/marketplaceCities';
import { MarketplacePage } from '@/features/marketplace';
import { buildMarketplaceCityItemListJsonLd } from '@/features/marketplace/seo/marketplaceCityJsonLd';
import { MARKETPLACE_OG_IMAGE } from '@/features/marketplace/seo/marketplaceOpenGraph';
import { searchMarketplaceBusinesses } from '@/features/marketplace/server/searchMarketplaceBusinesses';
import type { MarketplaceBusiness } from '@/features/marketplace/types/marketplace';
import {
  isCuratedMarketplaceCitySlug,
  resolveMarketplaceCityFromSlug,
} from '@/features/marketplace/utils/marketplaceLocationSlug';
import {
  getFindDetailersCityPath,
  getPublicBusinessProfilePath,
  ROUTES,
} from '@/constants/routes';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');
const marketplacePublicEnabled = isMarketplacePublicEnabled();

/** Prefetch curated cities at build time; any other valid slug is on-demand. */
export function generateStaticParams() {
  return MARKETPLACE_CITIES.map(city => ({ city: city.slug }));
}

export const dynamicParams = true;

const loadCityPageData = cache(async (citySlug: string) => {
  const city = resolveMarketplaceCityFromSlug(citySlug);
  if (!city) return null;

  let businesses: MarketplaceBusiness[] = [];
  let location = city.displayName;

  try {
    const result = await searchMarketplaceBusinesses(city.searchQuery);
    businesses = result.businesses;
    location = result.location || city.displayName;
  } catch (error) {
    console.error('[marketplace] city page search failed', city.slug, error);
  }

  return { city, businesses, location };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const data = await loadCityPageData(citySlug);
  if (!data) {
    return { title: 'Detailers not found' };
  }

  const { city, businesses } = data;
  const cityPath = getFindDetailersCityPath(city.slug);
  const title = marketplaceCityTitle(city);
  const description = marketplaceCityDescription(city, businesses.length);
  const isCurated = isCuratedMarketplaceCitySlug(city.slug);
  const shouldIndex =
    marketplacePublicEnabled && (isCurated || businesses.length > 0);

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${siteUrl}${cityPath}`,
      title: `${title} | ServiceLink`,
      description,
      siteName: 'ServiceLink',
      images: [
        {
          ...MARKETPLACE_OG_IMAGE,
          alt: `Find auto detailers in ${city.displayName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ServiceLink`,
      description,
      images: [MARKETPLACE_OG_IMAGE.url],
    },
    alternates: {
      canonical: `${siteUrl}${cityPath}`,
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function FindDetailersCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  if (!marketplacePublicEnabled) {
    notFound();
  }

  const { city: citySlug } = await params;
  const data = await loadCityPageData(citySlug);
  if (!data) {
    notFound();
  }

  const { city, businesses, location } = data;
  const cityPath = getFindDetailersCityPath(city.slug);
  const jsonLd = buildMarketplaceCityItemListJsonLd({
    city,
    cityPath,
    businesses,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Auto detailers in {city.displayName}</h1>
      <ul className="sr-only">
        {businesses.map(business => (
          <li key={business.id}>
            <a href={getPublicBusinessProfilePath(business.slug)}>
              {business.name} — {business.serviceArea}
            </a>
          </li>
        ))}
        <li>
          <a href={ROUTES.FIND_DETAILERS}>Find detailers in more cities</a>
        </li>
      </ul>
      <Suspense fallback={null}>
        <MarketplacePage
          initialLocation={location}
          initialBusinesses={businesses}
          citySlug={city.slug}
        />
      </Suspense>
    </>
  );
}
