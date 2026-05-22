import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const WORKSHOP_PAGE_PATH = '/workshop/run-ads';
export const WORKSHOP_CANONICAL_URL = `${SITE_URL}${WORKSHOP_PAGE_PATH}`;

export const WORKSHOP_HERO = {
  eyebrow: 'Free On-Demand Masterclass',
  title: 'How to Run Local Ads That Fill Your Calendar Automatically',
  subtitle:
    'The exact 3-step Facebook & Instagram ad setup for mobile detailers and service businesses to secure bookings without chasing leads in the DMs.',
} as const;

export const WORKSHOP_GATE = {
  title: 'Unlock Instant Access',
  description:
    'Enter your email to open the 15-minute video guide immediately.',
  submitLabel: 'Watch the Free Class',
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

const WORKSHOP_KEYWORDS = [
  'Facebook ads for mobile detailers',
  'Instagram ads local service business',
  'Meta ads mobile detailing',
  'run Facebook ads detailing business',
  'local lead ads service business',
  'book more detailing appointments',
  'mobile detailer marketing',
  'ServiceLink workshop',
].join(', ');

export function getWorkshopPageMetadata(): Metadata {
  return {
    title:
      'How to Run Local Ads That Fill Your Calendar | Free Masterclass | ServiceLink',
    description: `${WORKSHOP_HERO.subtitle} Free on-demand video workshop for mobile detailers and service pros. Learn Meta Ads Manager targeting, video creatives, and booking links that convert.`,
    keywords: WORKSHOP_KEYWORDS,
    alternates: {
      canonical: WORKSHOP_CANONICAL_URL,
    },
    openGraph: {
      title: WORKSHOP_HERO.title,
      description: WORKSHOP_HERO.subtitle,
      url: WORKSHOP_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/open-graph.png',
          width: 1200,
          height: 630,
          alt: 'ServiceLink — Free Run Local Ads Workshop',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: WORKSHOP_HERO.title,
      description: WORKSHOP_HERO.subtitle,
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
