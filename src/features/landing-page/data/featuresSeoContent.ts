import { MARKETING_IMAGES } from '@/constants/marketingImages';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  LinkIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import type { ComponentType, SVGProps } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const FEATURES_PAGE_PATH = '/features';
export const FEATURES_CANONICAL_URL = `${SITE_URL}${FEATURES_PAGE_PATH}`;

export const FEATURES_HERO = {
  /** Visible H1 on /features */
  title: 'Features',
  subtitle: 'Booking, scheduling, payments, and client tools in one platform.',
  /** `<title>`, Open Graph, and JSON-LD — keyword-focused for search */
  seoTitle: 'Mobile Detailer Booking System Features',
  seoDescription:
    'ServiceLink is a mobile detailer booking system with a shareable booking link, availability calendar, service menu with categories and vehicle pricing, in-app deposits, quote requests, and a CRM that builds from every appointment.',
} as const;

export type FeatureCardContent = {
  id: string;
  name: string;
  bullets: readonly string[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  image?: string;
  imageAlt?: string;
};

export const FEATURE_CARDS: readonly FeatureCardContent[] = [
  {
    id: 'booking-link',
    name: 'Booking link',
    bullets: [
      'One link for bio, texts & business cards',
      'Guest booking—no account required',
      'Mobile-first page with your services & photos',
    ],
    icon: LinkIcon,
    image: MARKETING_IMAGES.features.bookingLink,
    imageAlt:
      'ServiceLink booking link profile on iPhone for a mobile service business',
  },
  {
    id: 'calendar',
    name: 'Calendar & scheduling',
    bullets: [
      'Set the days and times you are available',
      'Customers pick an open slot when they book',
      'Block time off when you are booked or away',
      'See and manage bookings from your dashboard',
    ],
    icon: CalendarDaysIcon,
    image: MARKETING_IMAGES.features.calendar,
    imageAlt:
      'ServiceLink availability calendar on iPhone showing open booking slots',
  },
  {
    id: 'services',
    name: 'Services',
    bullets: [
      'Group Interior, Exterior & packages with categories',
      'Sedan, SUV & truck pricing on one service',
      'Show the right price before they pick a time',
      'Reorder your menu to match what you sell most',
    ],
    icon: WrenchScrewdriverIcon,
    image: MARKETING_IMAGES.features.services,
    imageAlt: 'ServiceLink services menu with categories and pricing on iPhone',
  },
  {
    id: 'payments',
    name: 'In-app payments & deposits',
    bullets: [
      'Collect a deposit or full payment at checkout',
      'Cut no-shows on premium details',
      'Secure checkout when customers book',
    ],
    icon: BanknotesIcon,
    image: MARKETING_IMAGES.features.payments,
    imageAlt: 'ServiceLink in-app deposit and payment checkout on iPhone',
  },
  {
    id: 'quotes',
    name: 'Quote creation',
    bullets: [
      'Customers request a quote from your page',
      'Send pricing from your dashboard',
      'Skip the Instagram DM back-and-forth',
    ],
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    id: 'crm',
    name: 'CRM that builds itself',
    bullets: [
      'Every booking saves name, phone & email',
      'Visit history stays on each client',
      'Rebook repeats without digging through chats',
    ],
    icon: UserGroupIcon,
  },
] as const;

export type FeatureCarouselSlide = {
  id: string;
  name: string;
  outcome: string;
  bullets: readonly string[];
  image: string;
  imageAlt: string;
};

/** Swipeable product showcase — one slide per screen. */
export const FEATURE_CAROUSEL_SLIDES: readonly FeatureCarouselSlide[] = [
  {
    id: 'home-screen',
    name: 'Manage your day',
    outcome: 'Your schedule and next job, right in your pocket.',
    image: MARKETING_IMAGES.features.homeScreen,
    imageAlt:
      'ServiceLink mobile app home screen on iPhone showing today’s schedule and next appointment',
    bullets: [
      'See today’s bookings at a glance',
      'Navigate or message your next client in one tap',
      'Run your business from your phone—not a laptop',
    ],
  },
  {
    id: 'booking-link',
    name: 'Booking link',
    outcome: 'Stop repeating your prices in every message.',
    image: MARKETING_IMAGES.features.bookingLink,
    imageAlt:
      'ServiceLink shareable booking link on iPhone for Instagram bio and DMs',
    bullets: [
      'Clean link that looks legit anywhere you post it',
      'Customers see your menu and tap to book',
      'Built for phone—where your clients actually find you',
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar & scheduling',
    outcome: 'Fill your calendar without playing phone tag.',
    image: MARKETING_IMAGES.features.calendar,
    imageAlt:
      'ServiceLink availability calendar on iPhone showing open booking slots',
    bullets: [
      'Set the days and times you actually work',
      'Customers choose an open slot when they book',
      'Block off time when you are booked or away',
    ],
  },
  {
    id: 'services',
    name: 'Services menu',
    outcome: 'No more “how much for an SUV?” in your DMs.',
    image: MARKETING_IMAGES.features.services,
    imageAlt: 'ServiceLink services menu with categories and pricing on iPhone',
    bullets: [
      'Group Interior, Exterior, and packages with categories',
      'Sedan, SUV, and truck pricing on one service',
      'Right price shown before they pick a time',
    ],
  },
  {
    id: 'payments',
    name: 'Payments & deposits',
    outcome: 'Get paid when they book—not after the job.',
    image: MARKETING_IMAGES.features.payments,
    imageAlt: 'ServiceLink in-app deposit and payment checkout on iPhone',
    bullets: [
      'Collect a deposit or full payment at checkout',
      'Cut no-shows on premium details',
      'Secure checkout when customers confirm',
    ],
  },
] as const;

/** Text-only features shown below the carousel (no mock yet). */
export const FEATURE_SECONDARY_CARDS = FEATURE_CARDS.filter(
  feature => !feature.image
);

export const FEATURES_FAQS: readonly { question: string; answer: string }[] = [
  {
    question: 'Do customers need an account to book?',
    answer:
      'No. They open your link, pick a service, choose a time, and confirm—no signup or app download required.',
  },
  {
    question: 'Can I charge different prices for sedans, SUVs, and trucks?',
    answer:
      'Yes. Under Services, set pricing options on one detail so customers pick their vehicle size and see the right price before booking.',
  },
  {
    question: 'Can I require a deposit before confirming a booking?',
    answer:
      'Yes. Collect a deposit or the full amount at checkout so serious customers lock in a slot before you block your calendar.',
  },
  {
    question: 'How long does setup take?',
    answer:
      'Most detailers are live in under ten minutes—add your services, set your availability, and drop the link in your bio or texts.',
  },
  {
    question: 'Will I get notified when someone books?',
    answer:
      'Yes. You get an email every time a new booking comes in, so you are not checking DMs hoping you did not miss someone.',
  },
];

export function featureCardSeoDescription(card: FeatureCardContent): string {
  return `${card.name}. ${card.bullets.join(' ')}`;
}

export function featureSlideSeoDescription(
  slide: FeatureCarouselSlide
): string {
  return `${slide.name}. ${slide.outcome} ${slide.bullets.join(' ')}`;
}

const FEATURES_KEYWORDS = [
  'mobile detailer booking system',
  'car detailing booking software',
  'online scheduling for detailers',
  'detailing availability calendar',
  'detailing booking link',
  'collect deposit for car detailing',
  'detailing quote software',
  'detailing CRM',
  'vehicle size pricing detailing',
  'mobile detailing app',
  'service business booking software',
  'ServiceLink features',
].join(', ');

export type FeaturesSeoFeatureEntry = {
  id: string;
  name: string;
  description: string;
};

export function getFeaturesSeoFeatureList(): FeaturesSeoFeatureEntry[] {
  return [
    ...FEATURE_CAROUSEL_SLIDES.map(slide => ({
      id: slide.id,
      name: slide.name,
      description: featureSlideSeoDescription(slide),
    })),
    ...FEATURE_SECONDARY_CARDS.map(card => ({
      id: card.id,
      name: card.name,
      description: featureCardSeoDescription(card),
    })),
  ];
}

export function getFeaturesPageMetadata(): Metadata {
  return {
    title: FEATURES_HERO.seoTitle,
    description: FEATURES_HERO.seoDescription.slice(0, 160),
    keywords: FEATURES_KEYWORDS,
    alternates: {
      canonical: FEATURES_CANONICAL_URL,
    },
    openGraph: {
      title: `${FEATURES_HERO.seoTitle} | ServiceLink`,
      description: FEATURES_HERO.seoDescription,
      url: FEATURES_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: MARKETING_IMAGES.brand.openGraph,
          width: 1200,
          height: 630,
          alt: 'ServiceLink mobile detailer booking system features',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${FEATURES_HERO.seoTitle} | ServiceLink`,
      description: FEATURES_HERO.seoDescription,
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
