/**
 * List of resource guides. Used for the Resources index and for resolving /resources/[slug].
 * Add new guides here; each needs a unique slug for the URL.
 * metaDescription is used for SEO (title/meta/OG); keep it under ~160 characters.
 */
export interface GuideMeta {
  slug: string;
  title: string;
  subheading: string;
  /** Optional SEO meta description; falls back to subheading if not set. */
  metaDescription?: string;
  /** Optional SEO keywords for the article page. */
  keywords?: string[];
  /** Optional ISO date for Article schema (e.g. "2026-01-15"). */
  datePublished?: string;
  /** Optional ISO date for Article schema; defaults to datePublished if not set. */
  dateModified?: string;
  /** Optional FAQ entries for FAQPage JSON-LD (plain-text answers). */
  faqs?: readonly { question: string; answer: string }[];
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'best-booking-app-for-mobile-detailers',
    title: 'Best Booking App for Mobile Detailers',
    subheading:
      'Compare booking apps for detailers—what to look for, how options stack up, and how to turn your link into more confirmed jobs.',
    metaDescription:
      'Looking for the best booking app for detailers? Compare scheduling software, must-have features, and how ServiceLink helps mobile detailers get more bookings.',
    keywords: [
      'booking app for detailers',
      'best app for detailers',
      'mobile detailing booking software',
      'car detailing scheduling app',
      'online booking for mobile detailers',
      'detailing booking link',
      'ServiceLink',
    ],
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    faqs: [
      {
        question: 'What is the best booking app for mobile detailers?',
        answer:
          'The best app depends on your workflow, but most detailers need a shareable booking link, service menu with clear pricing, controlled availability, and optional deposits—not just a basic calendar. ServiceLink is built around that flow for mobile service businesses.',
      },
      {
        question: 'Do my customers need to download an app to book?',
        answer:
          'No. With ServiceLink, customers open your booking link in their browser, pick a service and time, and confirm—no account or app download required on their end.',
      },
      {
        question: 'Can I require a deposit before confirming a booking?',
        answer:
          'Yes. You can collect a deposit or full payment at checkout so premium details are locked in before you drive to the job.',
      },
      {
        question: 'How fast can I set up a booking page?',
        answer:
          'Most detailers add their services, set availability, and share their link the same day—often in under ten minutes.',
      },
    ],
  },
  {
    slug: 'how-mobile-detailers-get-clients-from-instagram-2026',
    title: 'How Mobile Detailers Get Clients From Instagram',
    subheading:
      'Learn how to get new bookings from Instagram and TikTok with the right videos and a simple booking link—no big following required.',
    metaDescription:
      'Learn how mobile detailers get clients from Instagram and TikTok. Video ideas, local SEO tips, and a booking link to turn viewers into customers.',
    keywords: [
      'mobile car detailing',
      'get clients from Instagram',
      'Instagram for detailers',
      'TikTok for car detailing',
      'detailing business marketing',
      'booking link for detailers',
      'ServiceLink',
    ],
    datePublished: '2026-01-15',
    dateModified: '2026-01-15',
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find(g => g.slug === slug);
}
