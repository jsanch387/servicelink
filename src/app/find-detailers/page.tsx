import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { MARKETPLACE_CITIES } from '@/features/marketplace/config/marketplaceCities';
import { MarketplacePage } from '@/features/marketplace';
import { buildMarketplaceHubJsonLd } from '@/features/marketplace/seo/marketplaceHubJsonLd';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { getFindDetailersCityPath, ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');
const marketplacePublicEnabled = isMarketplacePublicEnabled();

const title = 'Find Auto Detailers Near You | Service Link';
const description =
  'Find trusted auto detailers near you. Search by city or ZIP, compare mobile and shop detailing, ratings, and prices, then book online on Service Link.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    url: `${siteUrl}${ROUTES.FIND_DETAILERS}`,
    title,
    description,
    siteName: 'Service Link',
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: 'Find auto detailers near you on Service Link',
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
    canonical: `${siteUrl}${ROUTES.FIND_DETAILERS}`,
  },
  robots: marketplacePublicEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function MarketplaceRoutePage() {
  if (!marketplacePublicEnabled) {
    notFound();
  }

  const jsonLd = buildMarketplaceHubJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Crawlable city links for SEO — not shown in the UI. */}
      <nav aria-label="Detailers by city" className="sr-only">
        <ul>
          {MARKETPLACE_CITIES.map(city => (
            <li key={city.slug}>
              <Link href={getFindDetailersCityPath(city.slug)}>
                Auto detailers in {city.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Suspense fallback={null}>
        <MarketplacePage />
      </Suspense>
    </>
  );
}
