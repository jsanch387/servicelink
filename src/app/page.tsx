import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { LandingPage } from '@/features/landing-page';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'ServiceLink | One Link. Your Services. Get Booked.',
  description:
    'Create a professional booking link for your service business. Share one link—myservicelink.app/yourbusiness—and let customers see your services and book instantly.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'ServiceLink | One Link. Your Services. Get Booked.',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: 'ServiceLink — Your business, ready to book.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServiceLink | One Link. Your Services. Get Booked.',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
    images: [MARKETING_IMAGES.brand.openGraph],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function Home() {
  return <LandingPage />;
}
