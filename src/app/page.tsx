import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { LandingPage } from '@/features/landing-page';
import {
  HOME_SEO_DESCRIPTION,
  HOME_SEO_TITLE,
} from '@/features/landing-page/data/homeSeoContent';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: {
    absolute: HOME_SEO_TITLE,
  },
  description: HOME_SEO_DESCRIPTION,
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: 'ServiceLink — booking app for mobile detailers.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [MARKETING_IMAGES.brand.openGraph],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function Home() {
  return <LandingPage />;
}
