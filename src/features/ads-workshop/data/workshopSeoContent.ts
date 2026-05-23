import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const WORKSHOP_PAGE_PATH = '/workshop';
export const WORKSHOP_CANONICAL_URL = `${SITE_URL}${WORKSHOP_PAGE_PATH}`;

/** Visible hero on `/workshop` (email gate). */
export const WORKSHOP_HERO = {
  eyebrow: 'Free Masterclass',
  title:
    'Stop Chasing Leads in the DMs. Let Ads Pack Your Calendar Automatically.',
  subtitle:
    'The exact $10/day Facebook ads framework mobile detailers and local service businesses use to get more detailing clients, secure confirmed bookings, and stop playing phone tag.',
} as const;

/** Page `<head>` metadata — tuned for search intent (App Router `metadata` export). */
export const WORKSHOP_PAGE_METADATA = {
  title:
    'Free Masterclass: Facebook Ads for Mobile Detailing & Service Businesses',
  description:
    'Learn the exact 3-step Meta ads blueprint to get more detailing clients, secure upfront deposits, and fill your service calendar automatically.',
  keywords: [
    'how to get detailing clients',
    'facebook ads for mobile detailing',
    'grow a detailing business',
    'marketing for service businesses',
    'automated booking calendar',
    'meta ads for detailers',
    'mobile detailing marketing',
    'ServiceLink workshop',
  ],
} as const;

export const WORKSHOP_GATE = {
  title: 'Unlock instant access',
  description:
    'Enter your email to open the 20-minute video guide immediately.',
  submitLabel: 'Watch the free class',
  consent:
    'By continuing, you agree to receive workshop updates. Unsubscribe anytime.',
} as const;

export type WorkshopCurriculumTopic = {
  id: string;
  number: string;
  title: string;
  description: string;
};

export const WORKSHOP_CURRICULUM_TOPICS: readonly WorkshopCurriculumTopic[] = [
  {
    id: 'radius',
    number: '01',
    title: 'The 15-Mile Radius Rule',
    description:
      'How to properly configure Meta Ads Manager so you only spend budget on local car owners inside your physical service perimeter, preventing wasted ad spend.',
  },
  {
    id: 'video-formats',
    number: '02',
    title: 'High-Converting Video Formats',
    description:
      'The exact type of quick smartphone video content that grabs attention in local social media feeds and establishes immediate trust with vehicle owners.',
  },
  {
    id: 'booking-friction',
    number: '03',
    title: 'Killing the "DM to Book" Friction',
    description:
      'Why forcing interested prospects to call or message you kills 50% of your sales momentum, and how online self-scheduling captures modern consumers instantly.',
  },
  {
    id: 'deposits',
    number: '04',
    title: 'Retainers & Revenue Protection',
    description:
      'How linking secure, upfront deposits straight to your booking platform filters out tire-kickers and eliminates weekend no-shows entirely.',
  },
] as const;

export function getWorkshopPageMetadata(): Metadata {
  return {
    title: WORKSHOP_PAGE_METADATA.title,
    description: WORKSHOP_PAGE_METADATA.description,
    keywords: WORKSHOP_PAGE_METADATA.keywords.join(', '),
    alternates: {
      canonical: WORKSHOP_CANONICAL_URL,
    },
    openGraph: {
      title: WORKSHOP_PAGE_METADATA.title,
      description: WORKSHOP_PAGE_METADATA.description,
      url: WORKSHOP_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/open-graph.png',
          width: 1200,
          height: 630,
          alt: 'Free Masterclass — Facebook Ads for Mobile Detailing | ServiceLink',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: WORKSHOP_PAGE_METADATA.title,
      description: WORKSHOP_PAGE_METADATA.description,
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
