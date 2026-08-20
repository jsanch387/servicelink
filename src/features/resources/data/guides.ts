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
    slug: 'how-to-start-a-mobile-detailing-business-2026',
    title: 'How to Start a Mobile Detailing Business in 2026',
    subheading:
      'A practical playbook for solo operators—startup costs, equipment, insurance, pricing, and how to get your first bookings without a shop.',
    coverImage: MARKETING_IMAGES.resources.startBusiness,
    coverImageAlt:
      'Mobile detailer with pressure washer, buckets, and towels beside a freshly washed car on a driveway',
    keyTakeaways: [
      'Most solo operators launch with $2,500–$8,000—not a shop lease or a custom van.',
      'Insurance, a simple LLC, and a clear service menu matter more than extra machines.',
      'Price packages by vehicle size on day one so you stop quoting every job over text.',
      'Get a Google Business Profile and one booking link live before you buy more gear.',
      'Your first 10 jobs come from neighbors, referrals, and local search—not a huge following.',
    ],
    metaDescription:
      'Start a mobile detailing business in 2026: startup costs, equipment, licenses, pricing, and how to get your first clients with a booking page.',
    keywords: [
      'how to start a mobile detailing business',
      'start a mobile detailing business',
      'mobile detailing business',
      'how to start a car detailing business',
      'mobile car detailing business',
      'mobile detailing startup costs',
      'mobile detailing equipment list',
      'start detailing business 2026',
      'ServiceLink',
    ],
    datePublished: '2026-08-20',
    dateModified: '2026-08-20',
    faqs: [
      {
        question: 'How much does it cost to start a mobile detailing business?',
        answer:
          'A lean solo setup usually costs $2,500–$8,000 for a pressure washer, extractor, chemicals, insurance, and basic branding. A more complete kit with a water tank and better machines often lands between $8,000 and $15,000. Custom van buildouts can run much higher—and most new operators do not need one in month one.',
      },
      {
        question: 'Do I need a license to start a mobile detailing business?',
        answer:
          'Requirements vary by city and state. Most operators form an LLC, get an EIN, open a business bank account, and carry general liability insurance. Many cities also want a local business license or mobile vendor permit. Check your city clerk and state rules before you take paid jobs.',
      },
      {
        question: 'Is a mobile detailing business profitable?',
        answer:
          'It can be. Solo mobile detailers often keep stronger margins than a leased shop because rent is low. Profit depends on pricing, drive time, no-shows, and how many repeat customers you keep. Operators who publish clear packages, take deposits, and stay booked locally typically do better than those who quote every job from scratch.',
      },
      {
        question: 'What equipment do I need to start mobile detailing?',
        answer:
          'Start with a pressure washer, hose and water plan, shop vac or extractor, buckets, mitts, towels, a foam cannon, interior brushes, and a core set of soaps and cleaners. Add a polisher and ceramic tools after you have consistent bookings—not before.',
      },
      {
        question: 'How do I get my first detailing customers?',
        answer:
          'Detail cars for friends and neighbors in exchange for Google reviews, set up a Google Business Profile as a service-area business, and put one booking link in your bio, texts, and profile. Local posts, door hangers, and Nextdoor beat a big following when you are just starting.',
      },
      {
        question: 'How long does it take to start a mobile detailing business?',
        answer:
          'Legal setup and insurance can take a few days to a couple of weeks. Equipment can be sourced in a weekend if you start lean. Many operators are ready to take paid bookings the same week they launch a simple service menu and booking page.',
      },
    ],
  },
  {
    slug: 'servicelink-vs-detail-connect-vs-detailermade-2026',
    title: 'ServiceLink vs Detail Connect vs DetailerMade (2026)',
    subheading:
      'Compare ServiceLink, Detail Connect, and DetailerMade for mobile detailing—and see why detailers pick the simple, organized, sleek booking app.',
    coverImage: MARKETING_IMAGES.resources.comparison2026,
    coverImageAlt:
      'ServiceLink vs Detail Connect vs DetailerMade — mobile detailing booking app comparison on a phone',
    keyTakeaways: [
      'ServiceLink wins when you want simple setup and a sleek customer booking page.',
      'Detail Connect and DetailerMade can fit teams that want denser, ops-heavy toolkits.',
      'Mobile detailers care about organization and UI as much as feature lists.',
      'Put one clean booking link in your bio so customers book without DMing.',
    ],
    metaDescription:
      'ServiceLink vs Detail Connect vs DetailerMade for mobile detailers in 2026. Compare booking links, UI, ease of use, and which app stays simple day to day.',
    keywords: [
      'ServiceLink vs Detail Connect vs DetailerMade',
      'ServiceLink vs Detail Connect',
      'ServiceLink vs DetailerMade',
      'Detail Connect vs DetailerMade',
      'Detail Connect alternative',
      'DetailerMade alternative',
      'best app for mobile detailers 2026',
      'best booking app for detailers',
      'detailing booking software comparison',
      'mobile detailing booking app',
      'ServiceLink',
    ],
    datePublished: '2026-08-19',
    dateModified: '2026-08-19',
    faqs: [
      {
        question: 'What is the best app for mobile detailers in 2026?',
        answer:
          'It depends on your workflow, but most mobile detailers want a shareable booking link, clear service pricing, controlled availability, and deposits—without a cluttered UI. ServiceLink is built around that simple, organized flow.',
      },
      {
        question: 'Is ServiceLink better than Detail Connect?',
        answer:
          'For solo detailers and small teams who want fast setup and a clean daily UI, ServiceLink is usually the better fit. Detail Connect can appeal to teams that want more operational depth and do not mind a denser interface.',
      },
      {
        question: 'How does ServiceLink compare to Detail Connect?',
        answer:
          'Both help detailers take online bookings. ServiceLink is usually chosen for faster setup and a cleaner daily experience. Detail Connect can appeal to teams that want more operational depth and do not mind a denser interface.',
      },
      {
        question: 'How does ServiceLink compare to DetailerMade?',
        answer:
          'DetailerMade may fit shops that want a broader module set. ServiceLink focuses on a sleek booking page and an organized dashboard that solo detailers and small teams can run between jobs.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a free booking page, add your services and availability, then share your link in Instagram, Google, and texts—often the same day.',
      },
    ],
  },
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
