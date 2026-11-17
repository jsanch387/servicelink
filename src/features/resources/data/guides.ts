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
  /** Other guide slugs shown in the shared “Related guides” block. */
  relatedSlugs?: readonly string[];
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'best-crm-for-mobile-detailers',
    title: 'Best CRM for Mobile Detailers (2026 Comparison)',
    subheading:
      'What a detailing CRM actually has to hold—clients, vehicles, job history, follow-up—and how ServiceLink compares with DetailDeck, Urable, QuoteIQ, Jobber, and Square.',
    coverImage: MARKETING_IMAGES.resources.crm,
    coverImageAlt:
      'Mobile detailer checking a booking and client list on their phone next to a freshly detailed car',
    keyTakeaways: [
      'A detailing CRM is clients, vehicles, job history, and a way to rebook—not a generic sales pipeline.',
      'ServiceLink is the better CRM for solo mobile detailers: booking link, reminders, review requests, and a client list that fills itself in.',
      'Free for the first 5 appointments, then Pro at $20/month or $200/year.',
      'Heavier suites are built for crews, recon, or estimating. Solo driveway shops pick the simple app.',
    ],
    metaDescription:
      'Compare the best CRM for mobile detailers. ServiceLink, DetailDeck, Urable, QuoteIQ, Jobber, and Square on price, booking, and deposits.',
    keywords: [
      'best CRM for mobile detailers',
      'mobile detailing CRM',
      'detailing CRM software',
      'auto detailing CRM',
      'best detailing CRM',
      'free detailing CRM',
      'ServiceLink',
    ],
    datePublished: '2026-11-17',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'servicelink-vs-detaildeck',
      'servicelink-vs-urable',
      'jobber-alternative-mobile-detailers',
      'best-booking-app-for-mobile-detailers',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'What is the best CRM for mobile detailers?',
        answer:
          'ServiceLink. Solo and small mobile shops that book from Instagram and Google get a public booking page, a client list that fills in from every appointment, vehicles, visit history, reminders, review requests, and deposits on Pro—starting free, then $20/month.',
      },
      {
        question: 'What should detailing CRM software actually do?',
        answer:
          'Hold the client, the vehicle, the job history, and a way to follow up or rebook. A calendar without a client record is not a CRM. A CRM without a booking link still leaves you quoting in DMs.',
      },
      {
        question: 'Is ServiceLink a CRM or just a booking app?',
        answer:
          'Both. The booking page is the front door. Every booking saves name, phone, email, vehicle, and visit history. You can import a client CSV when you switch. Pro adds vehicle-size prices, deposits, SMS reminders, review requests, quotes, invoices, expenses, and Tap to Pay.',
      },
      {
        question: 'Do I need Jobber or Urable if I am a solo detailer?',
        answer:
          'Usually no. Jobber and Urable are built as broader field-service suites for crews and denser ops. A one-truck operator needs a bio link, vehicle-size prices, deposits, reminders, and a client list—which is what ServiceLink is built to be.',
      },
      {
        question: 'Can I try ServiceLink while I keep my current CRM?',
        answer:
          'Yes. Put ServiceLink in the bio, keep the old tool until you are sure, and import names and numbers when you are ready to switch.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a booking page, add your services and availability, and share the link. The first 5 appointments are free. Pro is $20/month or $200/year.',
      },
    ],
  },
  {
    slug: 'mobile-tech-rx-alternative',
    title: 'Mobile Tech RX Alternative for Mobile Detailers',
    subheading:
      'MTX is built for auto recon and estimating. Solo mobile detailers usually need a bio booking link, deposits, and a client list—at a much lower price.',
    coverImage: MARKETING_IMAGES.resources.mobileTechRx,
    coverImageAlt:
      'ServiceLink versus Mobile Tech RX — mobile detailing booking app comparison on a phone',
    keyTakeaways: [
      'Mobile Tech RX is built for auto recon and shop-controlled estimating. ServiceLink is built for solo mobile detailers.',
      'ServiceLink gives you a public booking page, CRM, reminders, review requests, and deposits—free for 5 appointments, then $20/month.',
      'As of November 2026, MTX Getting Started is $39/admin/month. Their FAQ says customer self-booking is not offered yet.',
      'If you book interiors from Instagram, pick the booking app. MTX is a recon estimating suite.',
    ],
    metaDescription:
      'Mobile Tech RX alternative for mobile detailers. Compare ServiceLink and MTX on price, booking, estimates, and who each tool is built for.',
    keywords: [
      'Mobile Tech RX alternative',
      'ServiceLink vs Mobile Tech RX',
      'Mobile Tech RX vs ServiceLink',
      'MTX alternative for detailers',
      'mobile detailing booking software',
      'ServiceLink',
    ],
    datePublished: '2026-11-17',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-crm-for-mobile-detailers',
      'best-booking-app-for-mobile-detailers',
      'servicelink-vs-urable',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'Is ServiceLink a Mobile Tech RX alternative?',
        answer:
          'Yes for solo mobile detailers who need a booking page, CRM, deposits, and reminders. MTX is built for auto-recon shops that live in estimates, PPF, tint, and dealer jobs.',
      },
      {
        question: 'Does Mobile Tech RX have a customer booking link?',
        answer:
          'Not as of November 2026. MTX scheduling is shop-controlled. Their scheduling FAQ says customer self-booking on a website is not available yet.',
      },
      {
        question: 'Who is Mobile Tech RX built for?',
        answer:
          'Auto-recon and multi-service shops: PPF, vinyl, tint, PDR, hail, glass, body, and dealer estimating. Solo mobile detailers who book packages from a bio pick ServiceLink.',
      },
      {
        question:
          'How much does Mobile Tech RX cost compared with ServiceLink?',
        answer:
          'As of November 2026, MTX Getting Started is $39/admin/month ($429/year), Standard $99, Pro $199, plus extra users. ServiceLink is free for the first 5 appointments, then Pro at $20/month or $200/year.',
      },
      {
        question: 'Can I run both while I switch?',
        answer:
          'Yes. Keep MTX for in-progress estimates. Put ServiceLink in the bio for package bookings. Do not double-book the same truck.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a booking page, add your top packages with vehicle prices, and share the link. First 5 appointments are free. You do not have to cancel MTX on day one.',
      },
    ],
  },
  {
    slug: 'how-to-get-more-mobile-detailing-clients',
    title: 'How to Get More Mobile Detailing Clients',
    subheading:
      'Stop living in DMs. Make booking obvious, post local proof, use Google, ask for referrals, and run small paid tests without turning on Advantage+.',
    coverImage: MARKETING_IMAGES.resources.getClients,
    coverImageAlt:
      'Phone filming a foam-covered car during a mobile detailing job for local client content',
    keyTakeaways: [
      'DMs feel busy. A public menu, a booking link, and a deposit turn attention into jobs.',
      'Put one booking URL in the bio, Google profile, and texts. Customers should not need an app.',
      'Instagram and TikTok work when you name the city and show real jobs—not when you chase views in another state.',
      'Skip Meta Advantage+. If you test ads, use a tight map, one offer, and a booking page.',
    ],
    metaDescription:
      'How to get more mobile detailing clients: booking links, Instagram, Google, referrals, and a 30-day plan that does not live in your DMs.',
    keywords: [
      'how to get more mobile detailing clients',
      'how to get more detailing clients',
      'get more car detailing clients',
      'mobile detailing marketing',
      'how to get clients for a detailing business',
      'ServiceLink',
    ],
    datePublished: '2026-11-17',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'how-mobile-detailers-get-clients-from-instagram',
      'how-to-start-a-mobile-detailing-business',
      'how-much-to-charge-for-mobile-detailing',
      'stop-no-shows-deposits-mobile-detailing',
      'best-booking-app-for-mobile-detailers',
    ],
    faqs: [
      {
        question: 'How do I get more mobile detailing clients?',
        answer:
          'Make booking obvious with one public link, post local before/after work, keep Google Business Profile and reviews current, ask for referrals, and rebook past clients. Ads are optional and should send people to the booking page, not into DMs.',
      },
      {
        question: 'How do I get more detailing clients without ads?',
        answer:
          'A booking link in the bio, Google reviews, neighborhood posts, and asking every finished job for a referral. Most solos underuse repeats and Google before they need paid traffic.',
      },
      {
        question: 'Should I put a booking link in my Instagram bio?',
        answer:
          'Yes. If someone has to DM for a price and a time, you will lose jobs while you are on a driveway. Use one link on Instagram, TikTok, Google, and texts.',
      },
      {
        question:
          'How important is Google Business Profile for mobile detailers?',
        answer:
          'It is how neighbors confirm you are real. Set it as a service-area business, add real job photos, put the booking link as the website, and ask for reviews the day you finish.',
      },
      {
        question: 'Do deposits help me get more clients?',
        answer:
          'Deposits do not create leads. They turn maybe-bookings into slots that show up, so the calendar you filled is real. That is how you keep the clients you already got.',
      },
      {
        question: 'How fast can I put a booking link in my bio?',
        answer:
          'Most detailers add services, set hours, and share a ServiceLink page the same day. The first 5 appointments are free.',
      },
    ],
  },
  {
    slug: 'servicelink-vs-detaildeck',
    title: 'DetailDeck Alternative for Mobile Detailers',
    subheading:
      'Both give you a bio booking link. ServiceLink is the simpler one to use and adjust — and that is what detailers keep saying when they compare it to other apps.',
    coverImage: MARKETING_IMAGES.resources.comparisonDetailDeck,
    coverImageAlt:
      'Gloved hands holding a booking calendar on a phone in front of a foam-covered pickup truck',
    keyTakeaways: [
      'ServiceLink is the better everyday app for solo mobile detailers: a bio link, CRM, reminders, and review requests.',
      'Free for the first 5 appointments, then Pro at $20/month or $200/year.',
      'Change prices, hours, and services without fighting the app.',
      'DetailDeck is another booking-link tool. ServiceLink is the simpler one to live in—and the cheaper start.',
    ],
    metaDescription:
      'Looking for a DetailDeck alternative? ServiceLink is the simpler booking app to use and adjust — that is what detailers say when they compare options.',
    keywords: [
      'ServiceLink vs DetailDeck',
      'DetailDeck alternative for mobile detailers',
      'DetailDeck vs ServiceLink',
      'booking app for mobile detailers',
      'ServiceLink',
    ],
    datePublished: '2026-09-09',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-crm-for-mobile-detailers',
      'best-booking-app-for-mobile-detailers',
      'jobber-alternative-mobile-detailers',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'Is ServiceLink a DetailDeck alternative?',
        answer:
          'Yes. Both give solo detailers a shareable booking link. ServiceLink is the better everyday app: simpler to use, reminders and review requests after jobs, expenses on Pro, and a free start for the first 5 appointments.',
      },
      {
        question: 'Do customers need an app?',
        answer: 'No. They book in the browser.',
      },
      {
        question: 'Can I take deposits?',
        answer:
          'Yes. You can require a deposit at checkout so the slot is real before you drive.',
      },
      {
        question: 'Can I try ServiceLink while on DetailDeck?',
        answer:
          'Yes. Put ServiceLink in the bio, keep DetailDeck until you’re sure.',
      },
    ],
  },
  {
    slug: 'jobber-alternative-mobile-detailers',
    title: 'Jobber Alternative for Mobile Detailers',
    subheading:
      'Jobber is built for field-service crews. Solo Instagram detailers need a bio link, sedan / SUV / truck prices, and deposits—not a full ops suite.',
    coverImage: MARKETING_IMAGES.resources.bookingApp,
    coverImageAlt:
      'Mobile detailer checking a booking app on their phone next to a freshly detailed car',
    keyTakeaways: [
      'ServiceLink is the better Jobber alternative for solo mobile detailers: a bio link, vehicle prices, deposits, and reminders.',
      'Jobber is built for field-service crews. A one-truck shop needs a booking page, not a full ops suite.',
      'Free for the first 5 appointments, then Pro at $20/month or $200/year.',
      'Customers book as guests. You get SMS confirmations, review requests, and a client list that fills itself in.',
    ],
    metaDescription:
      'Jobber alternative for mobile detailers. Compare a bio booking link vs field-service software—and why ServiceLink is the simpler everyday pick.',
    keywords: [
      'Jobber alternative for detailers',
      'Jobber alternative for mobile detailers',
      'booking app for mobile detailers',
      'Jobber vs ServiceLink',
      'Jobber for detailing',
      'mobile detailing booking software',
      'ServiceLink',
    ],
    datePublished: '2026-09-04',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-booking-app-for-mobile-detailers',
      'best-crm-for-mobile-detailers',
      'servicelink-vs-urable',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'Is ServiceLink a Jobber alternative?',
        answer:
          'Yes. For solo and small mobile detailing businesses, ServiceLink is the booking app to use: one bio link, vehicle prices, deposits, reminders, review requests, and a client list—without a field-service suite.',
      },
      {
        question: 'Do my customers need an account?',
        answer:
          'No. They open the link, pick a service, and book. There is no customer app to download.',
      },
      {
        question: 'Can I keep Jobber and try ServiceLink?',
        answer:
          'Yes. Run ServiceLink as the bio link and keep Jobber until you do not need it.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a booking page, add your services and availability, then share your link in Instagram, Google, and texts—often the same day.',
      },
    ],
  },
  {
    slug: 'servicelink-vs-urable',
    title: 'Urable Alternative for Mobile Detailers',
    subheading:
      'Looking for an Urable alternative? Compare ServiceLink and Urable for mobile detailing—why detailers pick the leaner booking app over a heavier field-service suite.',
    coverImage: MARKETING_IMAGES.resources.comparisonUrable,
    coverImageAlt:
      'Detailer holding a phone with a clean booking dashboard while a luxury SUV is detailed in a driveway',
    keyTakeaways: [
      'ServiceLink is the better everyday booking app for mobile detailers: lean, sleek, and built for a one-truck week.',
      'Urable is a broader field-service platform. Solo detailers pick the booking link they will actually open between jobs.',
      'Customers finish a clean guest checkout—no app download.',
      'Free for the first 5 appointments, then Pro at $20/month or $200/year.',
    ],
    metaDescription:
      'Looking for an Urable alternative? Compare ServiceLink and Urable for mobile detailers—booking links, setup time, and which app stays lean.',
    keywords: [
      'ServiceLink vs Urable',
      'Urable alternative',
      'Urable vs ServiceLink',
      'Urable detailing app',
      'best app for mobile detailers',
      'detailing booking software comparison',
      'field service software for detailers',
      'simple detailing booking app',
      'ServiceLink',
    ],
    datePublished: '2026-08-27',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-booking-app-for-mobile-detailers',
      'best-crm-for-mobile-detailers',
      'jobber-alternative-mobile-detailers',
      'servicelink-vs-detail-connect-vs-detailermade',
    ],
    faqs: [
      {
        question: 'Is ServiceLink better than Urable for mobile detailers?',
        answer:
          'Yes. ServiceLink is the better fit for solo operators and small teams who want a clean booking link, reminders, review requests, and a simple daily dashboard. Urable is built as a broader field-service platform.',
      },
      {
        question: 'What is the main difference between ServiceLink and Urable?',
        answer:
          'ServiceLink is built around a shareable booking page, vehicle-based prices, availability, and deposits. Urable is a broader field-service platform with more modules. The tradeoff is a lean daily app versus a denser ops suite.',
      },
      {
        question: 'Does ServiceLink replace a full CRM like Urable?',
        answer:
          'ServiceLink covers the jobs most mobile detailers run every day: bookings, services, calendar, CRM, reminders, review requests, quotes, expenses, and payments. That is the stack a one-truck shop actually opens. Urable is built as a denser field-service platform.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a free booking page, add your services and availability, then share your link in Instagram, Google, and texts—often the same day.',
      },
    ],
  },
  {
    slug: 'how-much-to-charge-for-mobile-detailing',
    title: 'How Much to Charge for Mobile Detailing',
    subheading:
      'Typical U.S. prices for washes, interiors, and full details by vehicle size—plus add-ons, trip fees, and how to publish a menu customers can book.',
    coverImage: MARKETING_IMAGES.resources.pricing,
    coverImageAlt:
      'Wash bucket, microfiber towel, and foam cannon on a wet driveway beside a dark SUV',
    keyTakeaways: [
      'Publish packages by sedan / SUV / truck instead of quoting every job in DMs.',
      'Full details often land $200–$380 sedan and $260–$480 SUV in mid-cost markets.',
      'Charge extra for pet hair, heavy soil, and long drives—do not hide it in the base price.',
      'If you are booked two weeks out, raise the cheap package first.',
      'Put the menu on a ServiceLink booking page so people book without DMing.',
    ],
    metaDescription:
      'How much to charge for mobile detailing. See typical sedan, SUV, and truck prices, add-ons, and how to put your menu on a booking page.',
    keywords: [
      'how much to charge for mobile detailing',
      'mobile detailing prices',
      'mobile detailing price list',
      'how much is a mobile car detail',
      'car detailing prices sedan SUV',
      'mobile detailing rates',
      'how to price mobile detailing',
      'detailing package prices',
      'ServiceLink',
    ],
    datePublished: '2026-08-27',
    dateModified: '2026-09-09',
    faqs: [
      {
        question: 'How much should I charge for a mobile full detail?',
        answer:
          'In many mid-cost U.S. markets, a solo operator charges about $200–$380 for a sedan full detail and $260–$480 for an SUV. Trucks and neglected interiors sit higher. Price your local market, not the cheapest Facebook post.',
      },
      {
        question: 'How much is a mobile interior detail?',
        answer:
          'A thorough interior often runs $150–$260 for a sedan and $180–$320 for an SUV, before pet hair or heavy soil. If the car is packed with hair or trash, add a surcharge instead of eating the time.',
      },
      {
        question: 'Should I charge more for SUVs and trucks?',
        answer:
          'Yes. More glass, more carpet, and more time. Publish three sizes on each package so customers stop asking you to quote a Tahoe over text.',
      },
      {
        question: 'How do I show my detailing prices online?',
        answer:
          'Put sedan, SUV, and truck prices on a public booking page so people pick a package and a time. ServiceLink lets you do that on a shareable link—no app download for the customer.',
      },
    ],
  },
  {
    slug: 'how-to-start-a-mobile-detailing-business',
    title: 'How to Start a Mobile Detailing Business',
    subheading:
      'A practical playbook for solo operators—startup costs, equipment, insurance, pricing, and how to get your first bookings without a shop.',
    coverImage: MARKETING_IMAGES.resources.startBusiness,
    coverImageAlt:
      'Mobile detailer with pressure washer, buckets, and towels beside a freshly washed car on a driveway',
    keyTakeaways: [
      'Most solo operators launch with $2,500–$8,000—not a shop lease or a custom van.',
      'Insurance, a simple LLC, and a clear service menu matter more than extra machines.',
      'Price packages by vehicle size on day one so you stop quoting every job over text.',
      'Get a Google Business Profile and a ServiceLink booking link live before you buy more gear.',
      'Your first 10 jobs come from neighbors, referrals, and local search—not a huge following.',
    ],
    metaDescription:
      'Start a mobile detailing business: startup costs, equipment, licenses, pricing, and how to get your first clients with a booking page.',
    keywords: [
      'how to start a mobile detailing business',
      'start a mobile detailing business',
      'mobile detailing business',
      'how to start a car detailing business',
      'mobile car detailing business',
      'mobile detailing startup costs',
      'mobile detailing equipment list',
      'start detailing business',
      'ServiceLink',
    ],
    datePublished: '2026-08-21',
    dateModified: '2026-09-09',
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
          'Detail cars for friends and neighbors in exchange for Google reviews, set up a Google Business Profile as a service-area business, and put a ServiceLink booking link in your bio, texts, and profile. Local posts, door hangers, and Nextdoor beat a big following when you are just starting.',
      },
      {
        question: 'How long does it take to start a mobile detailing business?',
        answer:
          'Legal setup and insurance can take a few days to a couple of weeks. Equipment can be sourced in a weekend if you start lean. Many operators are ready to take paid bookings the same week they launch a simple service menu and booking page.',
      },
    ],
  },
  {
    slug: 'servicelink-vs-detail-connect-vs-detailermade',
    title: 'ServiceLink vs Detail Connect vs DetailerMade',
    subheading:
      'Compare ServiceLink, Detail Connect, and DetailerMade for mobile detailing—and see why detailers pick the simple, organized, sleek booking app.',
    coverImage: MARKETING_IMAGES.resources.comparison2026,
    coverImageAlt:
      'ServiceLink vs Detail Connect vs DetailerMade — mobile detailing booking app comparison on a phone',
    keyTakeaways: [
      'ServiceLink is the best everyday app: simple setup, a sleek booking page, reminders, and review requests.',
      'Detail Connect and DetailerMade are denser detailing tools. Solo shops pick the UI they will actually open.',
      'Mobile detailers care about organization and UI as much as feature lists.',
      'Put one clean booking link in your bio so customers book without DMing.',
    ],
    metaDescription:
      'ServiceLink vs Detail Connect vs DetailerMade for mobile detailers. Compare booking links, UI, ease of use, and which app stays simple day to day.',
    keywords: [
      'ServiceLink vs Detail Connect vs DetailerMade',
      'ServiceLink vs Detail Connect',
      'ServiceLink vs DetailerMade',
      'Detail Connect vs DetailerMade',
      'Detail Connect alternative',
      'DetailerMade alternative',
      'best app for mobile detailers',
      'best booking app for detailers',
      'detailing booking software comparison',
      'mobile detailing booking app',
      'ServiceLink',
    ],
    datePublished: '2026-08-19',
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-booking-app-for-mobile-detailers',
      'servicelink-vs-urable',
      'servicelink-vs-detaildeck',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'What is the best app for mobile detailers?',
        answer:
          'ServiceLink. Mobile detailers want a shareable booking link, clear service pricing, controlled availability, and deposits—without a cluttered UI. ServiceLink is built around that simple, organized flow.',
      },
      {
        question: 'Is ServiceLink better than Detail Connect?',
        answer:
          'Yes for solo detailers and small teams who want fast setup, a clean daily UI, reminders, and review requests. Detail Connect is a denser detailing tool with more operational knobs.',
      },
      {
        question: 'How does ServiceLink compare to Detail Connect?',
        answer:
          'Both help detailers take online bookings. ServiceLink wins on faster setup and a cleaner daily experience. Detail Connect is denser if you already run ops-heavy workflows.',
      },
      {
        question: 'How does ServiceLink compare to DetailerMade?',
        answer:
          'ServiceLink is the better everyday app: a sleek booking page, reminders, review requests, and an organized dashboard you can run between jobs. DetailerMade is built as a broader module set.',
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
      'Look for vehicle pricing, deposits, reminders, review requests, and a client list.',
      'Put your link everywhere customers already find you—bio, Google, texts.',
      'ServiceLink is the booking app that checks those boxes—free for 5 appointments, then $20/month.',
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
    dateModified: '2026-11-17',
    relatedSlugs: [
      'best-crm-for-mobile-detailers',
      'servicelink-vs-detaildeck',
      'jobber-alternative-mobile-detailers',
      'how-to-get-more-mobile-detailing-clients',
    ],
    faqs: [
      {
        question: 'What is the best booking app for mobile detailers?',
        answer:
          'ServiceLink. Mobile detailers need a shareable booking link, vehicle pricing, deposits, SMS reminders, review requests, and a client list—not just a basic calendar. ServiceLink is built around that flow.',
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
    relatedSlugs: [
      'best-booking-app-for-mobile-detailers',
      'best-crm-for-mobile-detailers',
      'how-to-get-more-mobile-detailing-clients',
      'jobber-alternative-mobile-detailers',
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
    dateModified: '2026-11-17',
    faqs: [
      {
        question: 'Should mobile detailers require deposits?',
        answer:
          'Yes. Detailers who don’t require deposits typically see much higher no-show and last-minute cancellation rates. A deposit filters out unserious bookings and protects your time and fuel costs. ServiceLink lets you require that deposit right on your booking link so you don’t have to ask for it over text.',
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
    slug: 'how-mobile-detailers-get-clients-from-instagram',
    title: 'How Mobile Detailers Get Clients From Instagram',
    subheading:
      'Learn how to get new bookings from Instagram and TikTok with the right videos and a simple booking link—no big following required.',
    coverImage: MARKETING_IMAGES.resources.instagram,
    coverImageAlt:
      'Phone filming a foam-covered car during a mobile detailing job for social content',
    keyTakeaways: [
      'You don’t need a huge following—local before/after content wins.',
      'Post process clips and clear offers that make booking obvious.',
      'Put a ServiceLink booking link in your bio so viewers can book without DMing.',
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
    dateModified: '2026-11-17',
    relatedSlugs: [
      'how-to-get-more-mobile-detailing-clients',
      'best-booking-app-for-mobile-detailers',
      'stop-no-shows-deposits-mobile-detailing',
    ],
    faqs: [
      {
        question: 'How do mobile detailers get clients from Instagram?',
        answer:
          'Post local before-and-after videos, name your city in the audio and caption, and put a booking link in the bio so viewers can book without a DM. You do not need a huge following.',
      },
      {
        question:
          'Do I need a lot of followers to get detailing clients on Instagram?',
        answer:
          'No. Local transformation clips outperform a big out-of-area audience. People in your service area need to see the work and have a way to book.',
      },
      {
        question: 'What should I put in my Instagram bio as a mobile detailer?',
        answer:
          'Service, city, and a booking link. Example: mobile detailing in your city, the packages you want, and a ServiceLink URL. Skip a long story in the bio.',
      },
      {
        question: 'Should I answer every booking request in DMs?',
        answer:
          'Send the booking link once. DMs are for exceptions and custom quotes, not for repeating your menu and Saturday availability on every job.',
      },
    ],
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find(g => g.slug === slug);
}
