import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const PRICING_PAGE_PATH = ROUTES.PRICING_PAGE;
export const PRICING_CANONICAL_URL = `${SITE_URL}${PRICING_PAGE_PATH}`;

/** Browser tab title (layout template adds "| ServiceLink"). */
export const PRICING_PAGE_SEO_TITLE = 'Mobile Detailer Booking App Pricing';

/** Meta description — keep under ~160 characters. */
export const PRICING_META_DESCRIPTION =
  'ServiceLink pricing for mobile detailers. Start free with a booking link, then upgrade to Pro for deposits, payments, and more confirmed jobs.';

const PRICING_KEYWORDS = [
  'mobile detailer booking app pricing',
  'detailing booking software cost',
  'ServiceLink pricing',
  'free booking app for detailers',
  'car detailing scheduling software price',
  'booking link for mobile detailers',
].join(', ');

export function getPricingPageMetadata(): Metadata {
  return {
    title: PRICING_PAGE_SEO_TITLE,
    description: PRICING_META_DESCRIPTION,
    keywords: PRICING_KEYWORDS,
    alternates: {
      canonical: PRICING_CANONICAL_URL,
    },
    openGraph: {
      title: `${PRICING_PAGE_SEO_TITLE} | ServiceLink`,
      description: PRICING_META_DESCRIPTION,
      url: PRICING_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: MARKETING_IMAGES.brand.openGraph,
          width: 1200,
          height: 630,
          alt: 'ServiceLink pricing for mobile detailers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${PRICING_PAGE_SEO_TITLE} | ServiceLink`,
      description: PRICING_META_DESCRIPTION,
      images: [MARKETING_IMAGES.brand.openGraph],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}
