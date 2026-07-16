import { MarketplacePage } from '@/features/marketplace';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'Service Marketplace | Find Local Service Pros',
  description:
    'Find trusted local service professionals near you. Connect with detailers, mobile mechanics, pet groomers, and more in your area.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/marketplace`,
    title: 'Service Marketplace | Find Local Service Pros',
    description:
      'Find trusted local service professionals near you. Connect with detailers and service pros in your area.',
  },
  alternates: {
    canonical: `${siteUrl}/marketplace`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketplaceRoutePage() {
  return <MarketplacePage />;
}
