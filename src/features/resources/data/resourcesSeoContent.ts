import { ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const RESOURCES_PAGE_PATH = '/resources';
export const RESOURCES_CANONICAL_URL = `${SITE_URL}${RESOURCES_PAGE_PATH}`;

export const RESOURCES_HERO = {
  title: 'Free Marketing Guides & Playbooks for Mobile Detailers',
  subtitle: 'Resources to scale your local service business.',
  /** Supporting line under the H1 — extra keywords for readers and crawlers. */
  description:
    'Step-by-step guides to get clients from Instagram and TikTok, build a professional booking link, and turn social traffic into paid appointments—written for detailers, pressure washers, and service pros.',
} as const;

export const RESOURCES_INTRO_PARAGRAPHS = [
  'Whether you are a mobile car detailer, pressure washing company, or lawn care operator, these resources focus on practical marketing you can run this week—not vague “post more content” advice.',
  'Learn how local SEO, short-form video, and a single booking link work together so prospects can see your services, request quotes, and schedule without endless DM back-and-forth.',
] as const;

export type ResourceTopicTile = {
  id: 'social' | 'booking-link';
  title: string;
  description: string;
};

export const RESOURCES_TOPIC_TILES: readonly ResourceTopicTile[] = [
  {
    id: 'social',
    title: 'Instagram & TikTok for local clients',
    description:
      'Video ideas, hooks, and posting rhythm that help nearby vehicle owners discover and trust your business.',
  },
  {
    id: 'booking-link',
    title: 'Booking links that convert',
    description:
      'How to present services, pricing, and availability on one page customers can use from your bio or ads.',
  },
];

/** Featured workshop promo card (linked from resources index). */
export const RESOURCES_WORKSHOP_CARD = {
  id: 'ads',
  title: 'Paid ads & workshops',
  description:
    'Meta ad fundamentals for service businesses, including our free on-demand workshop on running local Facebook and Instagram ads.',
  href: ROUTES.WORKSHOP,
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
      'Yes. Every article and playbook on this page is free to read. Some resources link to optional free workshops or ServiceLink signup when you want a booking link and dashboard.',
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
  'local service business SEO guides',
  'car detailing business tips',
  'ServiceLink resources',
  'pressure washing marketing guide',
].join(', ');

export function getResourcesPageMetadata(): Metadata {
  return {
    title: `${RESOURCES_HERO.title} | ServiceLink`,
    description: `${RESOURCES_HERO.subtitle} ${RESOURCES_HERO.description}`,
    keywords: RESOURCES_KEYWORDS,
    alternates: {
      canonical: RESOURCES_CANONICAL_URL,
    },
    openGraph: {
      title: RESOURCES_HERO.title,
      description: RESOURCES_HERO.subtitle,
      url: RESOURCES_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/open-graph.png',
          width: 1200,
          height: 630,
          alt: 'ServiceLink Resources for service businesses',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: RESOURCES_HERO.title,
      description: RESOURCES_HERO.subtitle,
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
