import { MARKETING_IMAGES } from '@/constants/marketingImages';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const RESOURCES_PAGE_PATH = '/resources';
export const RESOURCES_CANONICAL_URL = `${SITE_URL}${RESOURCES_PAGE_PATH}`;

/** Browser tab + Open Graph title (layout template adds "| ServiceLink"). */
export const RESOURCES_PAGE_SEO_TITLE =
  'Mobile Detailer Guides: Booking, Deposits & Instagram';

/** Meta description — keep under ~160 characters. */
export const RESOURCES_META_DESCRIPTION =
  'Free guides for mobile detailers on booking apps, deposits to stop no-shows, Instagram marketing, and growing your local detailing business with ServiceLink.';

/** Visible page header — keyword-rich but scannable. */
export const RESOURCES_HERO = {
  title: 'ServiceLink guides for mobile detailers',
  subtitle:
    'Articles on booking apps, deposits, Instagram marketing, and growing your local detailing business—written for owner-operators who want more confirmed jobs.',
} as const;

const RESOURCES_KEYWORDS = [
  'mobile detailer marketing resources',
  'mobile detailing deposits',
  'how to stop no shows detailing',
  'booking app for detailers',
  'booking link for mobile detailers',
  'get clients from Instagram detailing',
  'TikTok marketing for service business',
  'car detailing cancellation policy',
  'car detailing business tips',
  'ServiceLink resources',
].join(', ');

export function getResourcesPageMetadata(): Metadata {
  return {
    title: RESOURCES_PAGE_SEO_TITLE,
    description: RESOURCES_META_DESCRIPTION,
    keywords: RESOURCES_KEYWORDS,
    authors: [{ name: 'ServiceLink', url: SITE_URL }],
    creator: 'ServiceLink',
    publisher: 'ServiceLink',
    alternates: {
      canonical: RESOURCES_CANONICAL_URL,
    },
    openGraph: {
      title: `${RESOURCES_PAGE_SEO_TITLE} | ServiceLink`,
      description: RESOURCES_META_DESCRIPTION,
      url: RESOURCES_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: MARKETING_IMAGES.brand.openGraph,
          width: 1200,
          height: 630,
          alt: 'ServiceLink guides for mobile detailers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${RESOURCES_PAGE_SEO_TITLE} | ServiceLink`,
      description: RESOURCES_META_DESCRIPTION,
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
