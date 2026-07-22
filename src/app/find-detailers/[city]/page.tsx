import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import {
  getMarketplaceCityBySlug,
  MARKETPLACE_CITIES,
  marketplaceCityDescription,
  marketplaceCityTitle,
} from '@/features/marketplace/config/marketplaceCities';
import { MarketplacePage } from '@/features/marketplace';
import { buildMarketplaceCityItemListJsonLd } from '@/features/marketplace/seo/marketplaceCityJsonLd';
import { searchMarketplaceBusinesses } from '@/features/marketplace/server/searchMarketplaceBusinesses';
import type { MarketplaceBusiness } from '@/features/marketplace/types/marketplace';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import {
  getFindDetailersCityPath,
  getPublicBusinessProfilePath,
  ROUTES,
} from '@/constants/routes';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');
const marketplacePublicEnabled = isMarketplacePublicEnabled();

export function generateStaticParams() {
  return MARKETPLACE_CITIES.map(city => ({ city: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getMarketplaceCityBySlug(citySlug);
  if (!city) {
    return { title: 'Detailers not found' };
  }

  const cityPath = getFindDetailersCityPath(city.slug);
  const title = marketplaceCityTitle(city);
  const description = marketplaceCityDescription(city);

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${siteUrl}${cityPath}`,
      title,
      description,
      images: [
        {
          url: MARKETING_IMAGES.brand.openGraph,
          width: 1200,
          height: 630,
          alt: `Detailers in ${city.displayName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [MARKETING_IMAGES.brand.openGraph],
    },
    alternates: {
      canonical: `${siteUrl}${cityPath}`,
    },
    robots: marketplacePublicEnabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
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
  const city = getMarketplaceCityBySlug(citySlug);
  if (!city) {
    notFound();
  }

  const cityPath = getFindDetailersCityPath(city.slug);
  let businesses: MarketplaceBusiness[] = [];
  let location = city.displayName;

  try {
    const result = await searchMarketplaceBusinesses(city.searchQuery);
    businesses = result.businesses;
    location = result.location || city.displayName;
  } catch (error) {
    console.error('[marketplace] city page search failed', city.slug, error);
  }

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
