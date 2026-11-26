import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';
import { FaqPage } from '@/features/faq/components/FaqPage';
import { FaqPageStructuredData } from '@/features/faq/components/FaqPageStructuredData';
import {
  FAQ_PAGE_DESCRIPTION,
  FAQ_PAGE_KEYWORDS,
  FAQ_PAGE_TITLE,
} from '@/features/faq/data/faqPageContent';
import type { Metadata } from 'next';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

const canonical = `${SITE_URL}${ROUTES.FAQ}`;

export const metadata: Metadata = {
  title: { absolute: FAQ_PAGE_TITLE },
  description: FAQ_PAGE_DESCRIPTION,
  keywords: FAQ_PAGE_KEYWORDS.join(', '),
  alternates: { canonical },
  openGraph: {
    title: FAQ_PAGE_TITLE,
    description: FAQ_PAGE_DESCRIPTION,
    url: canonical,
    siteName: 'ServiceLink',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: 'ServiceLink FAQ for auto detailers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: FAQ_PAGE_TITLE,
    description: FAQ_PAGE_DESCRIPTION,
    images: [MARKETING_IMAGES.brand.openGraph],
  },
};

export default function FaqRoutePage() {
  return (
    <>
      <FaqPageStructuredData />
      <FaqPage />
    </>
  );
}
