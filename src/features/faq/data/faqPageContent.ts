import { ROUTES } from '@/constants/routes';
import { SERVICELINK_ONE_LINER } from '@/constants/brandCopy';
import {
  FREE_BOOKINGS_LIMIT,
  TEAM_MONTHLY_LIST_PRICE,
  TEAM_SEAT_LIMIT,
} from '@/features/pricing/types';

export const FAQ_PAGE_TITLE = 'FAQ | Booking App for Auto Detailers';

export const FAQ_PAGE_DESCRIPTION =
  'Answers on booking, deposits, CRM, SMS, and Free vs Pro. Customers book on a web link — no app. Built for mobile and shop detailers.';

export const FAQ_PAGE_KEYWORDS = [
  'best booking app for mobile detailers',
  'do customers need an app to book detailing',
  'mobile detailing deposits',
  'detailing CRM',
  'ServiceLink FAQ',
  'Free vs Pro ServiceLink',
];

export type FaqEntry = {
  question: string;
  answer: string;
};

export const FAQ_PAGE_ENTRIES: readonly FaqEntry[] = [
  {
    question: 'What is the best booking app for mobile detailers?',
    answer:
      'ServiceLink. You get a shareable booking page with packages and vehicle-size prices, a CRM that fills in from every job, SMS updates, and a Team plan when you hire. Customers book on the web — they never download an app.',
  },
  {
    question: 'Do customers need to download an app to book?',
    answer:
      'No. Customers open your ServiceLink in the browser, pick a package, vehicle size, and open time, and confirm. No account and no app on their end. You run the shop from the web or the iOS/Android apps.',
  },
  {
    question: 'Does ServiceLink take deposits and payments?',
    answer:
      'Yes, on Pro. Collect a deposit or the full amount at checkout so the slot is paid before you drive. Tap to Pay on iPhone is also on Pro. Free includes the booking link and five lifetime appointments — deposits, Tap to Pay, invoices, and quotes are not on Free.',
  },
  {
    question: 'Is ServiceLink a CRM or just a calendar?',
    answer:
      'Both. Every booking saves the client, phone, email, vehicle, and visit history. You rebook from that record instead of digging through DMs. That is the detailing CRM, with the booking page as the front door.',
  },
  {
    question: 'Does ServiceLink send SMS updates?',
    answer:
      'Yes. Customers get a confirmation and a day-before reminder. You can send on-the-way texts from the job. These are job updates — not marketing blasts or promo campaigns.',
  },
  {
    question: 'Is there a mobile app for the shop?',
    answer:
      'Yes. ServiceLink for Business is on the iOS App Store and Google Play. Owners and Team members run the day from the phone: jobs, on-the-way, Tap to Pay on Pro, and complete. Customers still book on the web link.',
  },
  {
    question: 'What is the difference between Free and Pro?',
    answer: `Free is ${FREE_BOOKINGS_LIMIT} lifetime appointments and a live booking link — no card required. It is not a time-limited trial. Pro is $20/month or $200/year: unlimited bookings, deposits, payments, quotes, invoices, SMS updates, and Tap to Pay. Team is ${TEAM_MONTHLY_LIST_PRICE}/month for up to ${TEAM_SEAT_LIMIT} people.`,
  },
  {
    question: 'Does ServiceLink work for mobile and shop detailers?',
    answer:
      'Yes. Mobile shops publish a service area. Brick-and-mortar shops publish a shop address. Same booking page, same CRM, same deposits on Pro. Most searches are for mobile detailing, but shop operators use the same system.',
  },
  {
    question: 'What is ServiceLink?',
    answer: SERVICELINK_ONE_LINER,
  },
];

export const FAQ_INTERNAL_LINKS = [
  { href: ROUTES.AUTO_DETAILING, label: 'Auto detailing booking app' },
  { href: ROUTES.PRICING_PAGE, label: 'Pricing' },
  { href: ROUTES.FEATURES_PAGE, label: 'Features' },
  {
    href: ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers'),
    label: 'Best booking app guide',
  },
] as const;
