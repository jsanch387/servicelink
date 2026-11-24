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
      'ServiceLink is the detailing CRM that books, reminds, collects, and asks for the review—then beats DetailDeck, Urable, QuoteIQ, Jobber, and Square on the jobs that fill a shop.',
    coverImage: MARKETING_IMAGES.resources.crm,
    coverImageAlt:
      'Detailer holding a phone with a client list in front of a closed silver sedan',
    keyTakeaways: [
      'The best detailing CRM books the job, saves the client and vehicle, reminds them, takes the deposit, and asks for the review.',
      'ServiceLink is the pick: full CRM + booking, automations, Google reviews on the page, expenses, Tap to Pay, and Team for up to 4 people.',
      'Try 5 appointments free. Pro is $20/month or $200/year. Team is $60/month.',
      'Simple to use is the point—not a smaller product. You get more bookings, fewer no-shows, more reviews, less admin.',
    ],
    metaDescription:
      'Best CRM for mobile detailers: ServiceLink vs DetailDeck, Urable, QuoteIQ, Jobber, and Square on booking, automations, reviews, and team.',
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
          'ServiceLink. You get a public booking page, a CRM that fills in from every appointment, vehicles, visit history, reminders, review requests, deposits, expenses, Tap to Pay, and Team for up to 4 people. Try 5 appointments free. Pro is $20/month.',
      },
      {
        question: 'What should detailing CRM software actually do?',
        answer:
          'Hold the client, the vehicle, the job history, and a way to follow up or rebook. A calendar without a client record is not a CRM. A CRM without a booking link still leaves you quoting in DMs.',
      },
      {
        question: 'Is ServiceLink a CRM or just a booking app?',
        answer:
          'Both—and the CRM is the whole shop. The booking page is the front door. Every booking saves name, phone, email, vehicle, and visit history. Pro adds vehicle-size prices, deposits, SMS reminders, review requests, quotes, invoices, expenses, and Tap to Pay. Team adds roles and job assignment.',
      },
      {
        question: 'Is ServiceLink enough if I have a team?',
        answer:
          'Yes. Team is $60/month or $600/year for up to 4 people: Member, Coordinator, and Manager roles, job assignment, and teammates running jobs in the iOS and Android apps. You get the same CRM, deposits, and automations.',
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
      'ServiceLink is the detailing CRM and booking system. Mobile Tech RX is recon estimating software. If you sell details, ServiceLink is the pick.',
    coverImage: MARKETING_IMAGES.resources.mobileTechRx,
    coverImageAlt:
      'Phone on a wet driveway beside a wash bucket, in front of a dark green SUV',
    keyTakeaways: [
      'ServiceLink is the pick for detailing shops: public booking, CRM, deposits, reminders, review requests, and Team.',
      'As of November 2026, MTX does not offer customer self-booking. Getting Started is $39/admin/month.',
      'ServiceLink: 5 appointments free, then Pro $20/month or Team $60/month for up to 4 people.',
      'More bookings, fewer no-shows, more reviews, less admin—without recon-suite pricing.',
    ],
    metaDescription:
      'Mobile Tech RX alternative for detailers. ServiceLink wins on booking, CRM, automations, reviews, and value—$20 Pro after 5 free jobs.',
    keywords: [
      'Mobile Tech RX alternative',
      'ServiceLink vs Mobile Tech RX',
      'Mobile Tech RX vs ServiceLink',
      'MTX alternative for detailers',
      'mobile detailing booking software',
      'ServiceLink',
    ],
    datePublished: '2026-11-17',
    dateModified: '2026-11-18',
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
          'Yes. ServiceLink is the Mobile Tech RX alternative for detailing shops: public booking, deposits, reminders, review requests, expenses, Tap to Pay, and Team. MTX is recon estimating software.',
      },
      {
        question: 'Does Mobile Tech RX have a customer booking link?',
        answer:
          'Not as of November 2026. MTX scheduling is shop-controlled. Their scheduling FAQ says customer self-booking on a website is not available yet.',
      },
      {
        question: 'Should a detailing shop use Mobile Tech RX or ServiceLink?',
        answer:
          'ServiceLink. Detailing shops need a public booking page, deposits, a CRM, reminders, and review requests. MTX is recon estimating. As of November 2026 their FAQ says customers cannot book themselves yet.',
      },
      {
        question:
          'How much does Mobile Tech RX cost compared with ServiceLink?',
        answer:
          'As of November 2026, MTX Getting Started is $39/admin/month ($429/year), Standard $99, Pro $199, plus extra users. ServiceLink is 5 appointments free, then Pro $20/month or $200/year, or Team $60/month for up to 4 people.',
      },
      {
        question: 'What if I already have jobs in Mobile Tech RX?',
        answer:
          'Finish recon estimates that are already open. Run new detailing bookings on ServiceLink. Put the ServiceLink link in the bio, Google, and texts, and do not double-book the same truck.',
      },
      {
        question: 'How do I try ServiceLink?',
        answer:
          'Create a booking page, add your top packages with vehicle prices, and share the ServiceLink link in your bio, Google, and texts. The first 5 appointments are free.',
      },
    ],
  },
  {
    slug: 'how-to-get-more-mobile-detailing-clients',
    title: 'How to Get More Mobile Detailing Clients',
    subheading:
      'Stop living in DMs. Put a ServiceLink booking link in the bio, post local proof, use Google, and ask for referrals.',
    coverImage: MARKETING_IMAGES.resources.getClients,
    coverImageAlt:
      'Hands holding a phone in front of a freshly beaded black sedan in a driveway',
    keyTakeaways: [
      'More bookings come from a ServiceLink page people can finish, instead of living in DMs.',
      'Put one ServiceLink URL in the bio, Google, and texts. Deposits and reminders keep the calendar real.',
      'Instagram and TikTok work when you name the city and show real jobs.',
      'Skip Meta Advantage+. If you test ads, send them to your ServiceLink booking page.',
    ],
    metaDescription:
      'How to get more mobile detailing clients with a ServiceLink booking link, Instagram, Google, referrals, and a 30-day plan.',
    keywords: [
      'how to get more mobile detailing clients',
      'how to get more detailing clients',
      'get more car detailing clients',
      'mobile detailing marketing',
      'how to get clients for a detailing business',
      'ServiceLink',
    ],
    datePublished: '2026-11-17',
    dateModified: '2026-11-18',
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
          'Put one ServiceLink booking link in the bio, Google, and texts. Post local before/after work, keep Google Business Profile current, ask for referrals, and rebook past clients from ServiceLink visit history. Ads should send people to that ServiceLink page.',
      },
      {
        question: 'How do I get more detailing clients without ads?',
        answer:
          'A booking link in the bio, Google reviews on that page, neighborhood posts, and asking every finished job for a referral. ServiceLink sends the review request when you tap complete.',
      },
      {
        question: 'Should I put a booking link in my Instagram bio?',
        answer:
          'Yes. Put your ServiceLink link on Instagram, TikTok, Google, and texts. If someone has to DM for a price and a time, you will lose jobs while you are on a driveway.',
      },
      {
        question:
          'How important is Google Business Profile for mobile detailers?',
        answer:
          'It is how neighbors confirm you are real. Set it as a service-area business, add real job photos, and use your ServiceLink link as the website. ServiceLink sends a review request when you mark the job complete, and connected Google reviews show on the booking page.',
      },
      {
        question: 'Do deposits help me get more clients?',
        answer:
          'Deposits turn maybe-bookings into slots that show up. On ServiceLink Pro, the deposit is collected when they book, so the calendar you filled is real.',
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
      'ServiceLink is the detailing CRM that books, reminds, collects, and asks for the review. DetailDeck is another booking link. ServiceLink is the pick.',
    coverImage: MARKETING_IMAGES.resources.comparisonDetailDeck,
    coverImageAlt:
      'Gloved hands holding a booking calendar on a phone in front of a foam-covered pickup truck',
    keyTakeaways: [
      'ServiceLink is the pick: booking, CRM, automations, review requests, Google reviews on the page, expenses, Tap to Pay, and Team.',
      'Try 5 appointments free. Pro $20/month or $200/year. Team $60/month for up to 4 people.',
      'Simple to use is a win: change prices, hours, and jobs without fighting the app.',
      'More bookings, fewer no-shows, more reviews, less admin.',
    ],
    metaDescription:
      'DetailDeck alternative: ServiceLink is the detailing CRM that wins on booking, automations, reviews, team, and value.',
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
          'Yes. ServiceLink is the detailing CRM: booking, reminders, review requests, expenses, Tap to Pay, and Team for up to 4 people. Try 5 appointments free. Pro is $20/month. DetailDeck publishes one $29/month plan as of November 2026.',
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
      'ServiceLink is the detailing CRM with booking, automations, reviews, and Team. Jobber is generic field-service software. Detailing shops pick ServiceLink.',
    coverImage: MARKETING_IMAGES.resources.bookingApp,
    coverImageAlt:
      'Mobile detailer checking a booking app on their phone next to a freshly detailed car',
    keyTakeaways: [
      'ServiceLink is the pick: detailing CRM, guest booking, deposits, reminders, review requests, Tap to Pay, and Team.',
      'Jobber is generic field-service software. Detailing shops want a bio link, vehicle prices, and automations that fire without extra modules.',
      'Try 5 appointments free. Pro $20/month. Team $60/month for up to 4 people with roles and job assignment.',
      'More bookings, fewer no-shows, more reviews, less admin.',
    ],
    metaDescription:
      'Jobber alternative for detailers: ServiceLink is the CRM that wins on booking, automations, reviews, team, and value.',
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
          'Yes. ServiceLink is the detailing CRM: one bio link, vehicle prices, deposits, reminders, review requests, a client list, and Team for up to 4 people. Jobber is a generic field-service suite.',
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
      'ServiceLink is the detailing CRM that books, reminds, collects, and asks for the review. Urable is a heavier field-service platform. ServiceLink is the pick.',
    coverImage: MARKETING_IMAGES.resources.comparisonUrable,
    coverImageAlt:
      'Detailer holding a phone with a clean booking dashboard while a luxury SUV is detailed in a driveway',
    keyTakeaways: [
      'ServiceLink is the pick: full CRM, guest booking, automations, reviews, expenses, Tap to Pay, and Team.',
      'Simple to use is a win. You get more bookings and less admin without a field-service maze.',
      'Try 5 appointments free. Pro $20/month. Team $60/month for up to 4 people.',
      'Urable lists online booking on Pro at $110/month as of November 2026. ServiceLink includes booking from day one.',
    ],
    metaDescription:
      'Urable alternative: ServiceLink is the detailing CRM that wins on booking, automations, reviews, team, and value.',
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
          'Yes. ServiceLink is the detailing CRM: booking, reminders, review requests, expenses, Tap to Pay, and Team. Urable is a broader field-service platform. Online booking there is listed on Pro at $110/month as of November 2026.',
      },
      {
        question: 'What is the main difference between ServiceLink and Urable?',
        answer:
          'ServiceLink is built around a shareable booking page, vehicle-based prices, availability, and deposits. Urable is a broader field-service platform with more modules. The tradeoff is a lean daily app versus a denser ops suite.',
      },
      {
        question: 'Does ServiceLink replace a full CRM like Urable?',
        answer:
          'ServiceLink is the full detailing CRM: bookings, services, calendar, clients, vehicles, reminders, review requests, quotes, expenses, payments, and Team. Urable is a denser field-service platform. Detailing shops pick ServiceLink.',
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
    dateModified: '2026-11-17',
    faqs: [
      {
        question: 'How much should I charge for a mobile full detail?',
        answer:
          'In many mid-cost U.S. markets, shops charge about $200–$380 for a sedan full detail and $260–$480 for an SUV. Trucks and neglected interiors sit higher. Price your local market, not the cheapest Facebook post.',
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
      'Startup costs, equipment, insurance, pricing, and how to get your first bookings—then run them on a CRM you will still use when you hire.',
    coverImage: MARKETING_IMAGES.resources.startBusiness,
    coverImageAlt:
      'Mobile detailer with pressure washer, buckets, and towels beside a freshly washed car on a driveway',
    keyTakeaways: [
      'Most new shops launch with $2,500–$8,000—not a shop lease or a custom van.',
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
    dateModified: '2026-11-17',
    faqs: [
      {
        question: 'How much does it cost to start a mobile detailing business?',
        answer:
          'A lean setup usually costs $2,500–$8,000 for a pressure washer, extractor, chemicals, insurance, and basic branding. A more complete kit with a water tank and better machines often lands between $8,000 and $15,000. Custom van buildouts can run much higher—and most new operators do not need one in month one.',
      },
      {
        question: 'Do I need a license to start a mobile detailing business?',
        answer:
          'Requirements vary by city and state. Most operators form an LLC, get an EIN, open a business bank account, and carry general liability insurance. Many cities also want a local business license or mobile vendor permit. Check your city clerk and state rules before you take paid jobs.',
      },
      {
        question: 'Is a mobile detailing business profitable?',
        answer:
          'It can be. Mobile shops often keep stronger margins than a leased storefront because rent is low. Profit depends on pricing, drive time, no-shows, and how many repeat customers you keep. Operators who publish clear packages, take deposits, and stay booked locally typically do better than those who quote every job from scratch.',
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
      'ServiceLink is the detailing CRM: booking, automations, reviews, and Team. Detail Connect and DetailerMade are other detailing tools. ServiceLink is the pick.',
    coverImage: MARKETING_IMAGES.resources.comparison2026,
    coverImageAlt:
      'ServiceLink vs Detail Connect vs DetailerMade — mobile detailing booking app comparison on a phone',
    keyTakeaways: [
      'ServiceLink is the pick: detailing CRM, guest booking, reminders, review requests, Google reviews on the page, and Team.',
      'Simple to use is a win. Customers finish checkout. You change prices without a maze.',
      'Try 5 appointments free. Pro $20/month. Team $60/month for up to 4 people.',
      'More bookings, fewer no-shows, more reviews, less admin.',
    ],
    metaDescription:
      'ServiceLink vs Detail Connect vs DetailerMade. ServiceLink is the detailing CRM that wins on booking, automations, reviews, and team.',
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
          'ServiceLink. You get a shareable booking link, vehicle pricing, deposits, reminders, review requests, a CRM, expenses, Tap to Pay, and Team for up to 4 people.',
      },
      {
        question: 'Is ServiceLink better than Detail Connect?',
        answer:
          'Yes. ServiceLink is the detailing CRM: booking, automations, reviews, expenses, Tap to Pay, and Team. Detail Connect is another detailing tool. ServiceLink is simpler to run and the pick.',
      },
      {
        question: 'How does ServiceLink compare to Detail Connect?',
        answer:
          'Both take online bookings. ServiceLink wins on ease of use, automations, review requests, Google reviews on the page, and Team. That is the better everyday system.',
      },
      {
        question: 'How does ServiceLink compare to DetailerMade?',
        answer:
          'ServiceLink is the pick: a sleek booking page, reminders, review requests, a CRM, and Team. DetailerMade is another module set. Detailing shops that want more bookings and less admin choose ServiceLink.',
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
      'ServiceLink is the booking app and detailing CRM: more confirmed jobs, fewer no-shows, more reviews, less admin.',
    coverImage: MARKETING_IMAGES.resources.bookingApp,
    coverImageAlt:
      'Detailer checking a booking app on their phone next to a freshly detailed car',
    keyTakeaways: [
      'A shareable booking link beats texts and DMs once you are busy.',
      'Look for vehicle pricing, deposits, reminders, review requests, a CRM, and Team.',
      'Put your link everywhere customers already find you—bio, Google, texts.',
      'ServiceLink is the pick: 5 appointments free, then Pro $20/month or Team $60/month.',
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
          'ServiceLink. You need a shareable booking link, vehicle pricing, deposits, SMS reminders, review requests, a client list, and Team—not just a basic calendar. ServiceLink is that system.',
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
