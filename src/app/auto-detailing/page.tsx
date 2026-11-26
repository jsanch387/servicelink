import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';
import { IndustryLandingPage } from '@/features/industry-landing/components/IndustryLandingPage';
import { IndustryStructuredData } from '@/features/industry-landing/components/IndustryStructuredData';
import { AUTO_DETAILING_LANDING } from '@/features/industry-landing/data/auto-detailing';
import type { Metadata } from 'next';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

const canonical = `${SITE_URL}${ROUTES.AUTO_DETAILING}`;
const content = AUTO_DETAILING_LANDING;

export const metadata: Metadata = {
  title: { absolute: content.seo.title },
  description: content.seo.description,
  keywords: content.seo.keywords.join(', '),
  alternates: { canonical },
  openGraph: {
    title: content.seo.ogTitle,
    description: content.seo.description,
    url: canonical,
    siteName: 'ServiceLink',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: content.seo.ogTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: content.seo.ogTitle,
    description: content.seo.description,
    images: [MARKETING_IMAGES.brand.openGraph],
  },
};

export default function AutoDetailingPage() {
  return (
    <>
      <IndustryStructuredData content={content} />
      <IndustryLandingPage content={content} />
    </>
  );
}
