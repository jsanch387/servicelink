import { MARKETING_IMAGES } from '@/constants/marketingImages';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const RESOURCES_PAGE_PATH = '/resources';
export const RESOURCES_CANONICAL_URL = `${SITE_URL}${RESOURCES_PAGE_PATH}`;

/** Browser tab + Open Graph title (layout template adds "| ServiceLink"). */
export const RESOURCES_PAGE_SEO_TITLE =
  'Free Marketing Guides for Mobile Detailers';

/** Meta description — keep under ~160 characters. */
export const RESOURCES_META_DESCRIPTION =
  'Free guides for mobile detailers: get clients from Instagram and TikTok, build a booking link, and grow your local service business.';

/** Visible page header — keyword-rich but scannable. */
export const RESOURCES_HERO = {
  title: 'Free marketing guides for mobile detailers',
  subtitle:
    'Booking links, Instagram, TikTok, and local SEO—pick a headline and start reading.',
} as const;

export const RESOURCES_FAQS: readonly { question: string; answer: string }[] = [
  {
    question: 'Who are ServiceLink resources for?',
    answer:
      'Our guides are written for owner-operators and small teams in mobile detailing, pressure washing, lawn care, and similar local service trades who want more bookings from social media and search.',
  },
  {
    question: 'Are these guides free?',
    answer:
      'Yes. Every article on this page is free to read. Some guides link to optional free workshops or ServiceLink signup when you want a booking link and dashboard.',
  },
  {
    question: 'How do mobile detailers get clients from Instagram and TikTok?',
    answer:
      'Start with local-focused content on both platforms (before/after, process clips, and clear offers), add a booking link in your bio, and post consistently so nearby customers can book without messaging you for every detail.',
  },
] as const;

const RESOURCES_KEYWORDS = [
  'mobile detailer marketing resources',
  'get clients from Instagram detailing',
  'TikTok marketing for service business',
  'booking link for mobile detailers',
  'booking app for detailers',
  'local service business SEO guides',
  'car detailing business tips',
  'ServiceLink resources',
  'pressure washing marketing guide',
].join(', ');

export function getResourcesPageMetadata(): Metadata {
  return {
    title: RESOURCES_PAGE_SEO_TITLE,
    description: RESOURCES_META_DESCRIPTION,
    keywords: RESOURCES_KEYWORDS,
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
          alt: 'ServiceLink free marketing guides for mobile detailers',
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
      },
    },
  };
}
