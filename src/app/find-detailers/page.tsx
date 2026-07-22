import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { MarketplacePage } from '@/features/marketplace';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';
const marketplacePublicEnabled = isMarketplacePublicEnabled();

export const metadata: Metadata = {
  title: 'Find Detailers Near You | Auto Detailing Services',
  description:
    'Find trusted auto detailers near you. Browse top-rated mobile and local detailing services in your area. Book professional car detailing today.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/find-detailers`,
    title: 'Find Detailers Near You | Auto Detailing Services',
    description:
      'Find trusted auto detailers near you. Browse top-rated mobile and local detailing services in your area.',
  },
  alternates: {
    canonical: `${siteUrl}/find-detailers`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketplaceRoutePage() {
  if (!marketplacePublicEnabled) {
    notFound();
  }

  return <MarketplacePage />;
}
