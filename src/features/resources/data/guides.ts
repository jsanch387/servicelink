/**
 * List of resource guides. Used for the Resources index and for resolving /resources/[slug].
 * Add new guides here; each needs a unique slug for the URL.
 * metaDescription is used for SEO (title/meta/OG); keep it under ~160 characters.
 */
import { MARKETING_IMAGES } from '@/constants/marketingImages';

export interface GuideMeta {
  slug: string;
  title: string;
  subheading: string;
  /** Cover image shown on the resources index card and article hero. */
  coverImage: string;
  /** Alt text for the cover image. */
  coverImageAlt: string;
  /** Short bullets shown near the top of the article. */
  keyTakeaways?: readonly string[];
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
    coverImage: MARKETING_IMAGES.resources.bookingApp,
    coverImageAlt:
      'Detailer checking a booking app on their phone next to a freshly detailed car',
    keyTakeaways: [
      'A shareable booking link beats texts and DMs once you’re busy.',
      'Look for service menus, vehicle pricing, availability control, and deposits.',
      'Put your link everywhere customers already find you—bio, Google, texts.',
      'ServiceLink can get you live the same day with a free booking page.',
    ],
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
    dateModified: '2026-07-19',
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
    slug: 'stop-no-shows-deposits-mobile-detailing',
    title: 'How to Stop No-Shows and Take Deposits for Mobile Detailing',
    subheading:
      'You blocked out your afternoon. You drove to the job. Nobody answered the door. Here’s how to make sure that never happens again.',
    coverImage: MARKETING_IMAGES.resources.deposits,
    coverImageAlt:
      'Smartphone showing a deposit payment confirmation over a car hood',
    keyTakeaways: [
      'No-shows cost you drive time, fuel, and a slot someone else would have paid for.',
      'Most detailers charge $25–$50 flat—or more on higher-ticket jobs.',
      'A simple 24-hour cancellation policy is enough if you enforce it every time.',
      'Deposits plus reminders are what get no-show rates near zero.',
    ],
    metaDescription:
      'Stop no-shows with mobile detailing deposits. Learn how much to charge, copy a cancellation policy, and collect deposits automatically with ServiceLink.',
    keywords: [
      'mobile detailing deposits',
      'how to stop no shows detailing',
      'car detailing cancellation policy',
      'how much deposit for car detailing',
      'no show fee car detailing',
      'detailing appointment reminders',
      'require deposit car detailing',
      'mobile detailing no show policy',
      'ServiceLink',
    ],
    datePublished: '2026-07-19',
    dateModified: '2026-07-19',
    faqs: [
      {
        question: 'Should mobile detailers require deposits?',
        answer:
          'Yes. Detailers who don’t require deposits typically see much higher no-show and last-minute cancellation rates. A deposit filters out unserious bookings and protects your time and fuel costs. An app like ServiceLink lets you require that deposit right on your booking link so you don’t have to ask for it over text.',
      },
      {
        question: 'How much deposit should I charge for car detailing?',
        answer:
          'Most detailers charge a flat $25-$50 for standard services and $50-$100 (or 20-50% of the job) for premium details like paint correction or ceramic coating. Higher-ticket jobs generally warrant a higher deposit.',
      },
      {
        question: 'Are car detailing deposits refundable?',
        answer:
          'That’s your call to make and state clearly upfront. Most detailers make deposits non-refundable for cancellations inside 24 hours, but transferable to a new appointment if the customer reschedules with enough notice.',
      },
      {
        question: 'What’s a fair no-show policy?',
        answer:
          'A common standard: wait 15 minutes past the scheduled arrival time, then mark the appointment a no-show and forfeit the deposit. Communicate this on your booking page so there’s no confusion later.',
      },
      {
        question: 'Can ServiceLink collect deposits for me automatically?',
        answer:
          'Yes. ServiceLink lets you require a deposit or full payment at checkout, so it’s collected the moment someone books — not something you have to ask for separately.',
      },
    ],
  },
  {
    slug: 'how-mobile-detailers-get-clients-from-instagram-2026',
    title: 'How Mobile Detailers Get Clients From Instagram',
    subheading:
      'Learn how to get new bookings from Instagram and TikTok with the right videos and a simple booking link—no big following required.',
    coverImage: MARKETING_IMAGES.resources.instagram,
    coverImageAlt:
      'Phone filming a foam-covered car during a mobile detailing job for social content',
    keyTakeaways: [
      'You don’t need a huge following—local before/after content wins.',
      'Post process clips and clear offers that make booking obvious.',
      'Put one booking link in your bio so viewers can book without DMing.',
      'Consistency beats perfection when you’re building local demand.',
    ],
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
