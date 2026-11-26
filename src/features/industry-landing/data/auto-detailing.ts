import { ROUTES } from '@/constants/routes';
import type { IndustryLandingContent } from '../types';

export const AUTO_DETAILING_LANDING: IndustryLandingContent = {
  id: 'auto-detailing',
  path: ROUTES.AUTO_DETAILING,
  seo: {
    title: 'Booking App for Auto Detailers | Mobile & Shop | ServiceLink',
    description:
      'Auto detailing software with a booking link, vehicle-size prices, deposits on Pro, and a CRM. Built for mobile detailing and shop detailers. Start free.',
    keywords: [
      'auto detailing software',
      'mobile detailing booking app',
      'detailing CRM',
      'booking app for auto detailers',
      'mobile detailing software',
      'car detailing booking software',
      'shop detailing booking',
    ],
    ogTitle: 'Booking App for Auto Detailers | Mobile & Shop',
  },
  hero: {
    eyebrow: 'Auto detailing',
    h1: 'Booking app for auto detailers.',
    h1Accent: 'Mobile and shop.',
    sub: 'Share a link. They pick a package, vehicle size, and time.',
  },
  howItWorks: {
    heading: 'How it works',
    steps: [
      {
        id: 'share',
        title: 'Share your link',
        line: 'Bio, Google, texts. One URL.',
      },
      {
        id: 'book',
        title: 'They book and pay a deposit',
        line: 'Open slot. Deposit on Pro.',
      },
      {
        id: 'show-up',
        title: 'You show up',
        line: 'Address, vehicle, job on your phone.',
      },
    ],
  },
  features: {
    heading: 'What you run the day on',
    tiles: [
      {
        id: 'booking',
        title: 'Booking page',
        line: 'Packages, sizes, open times.',
        screenshotSrc: null,
        screenshotAlt: 'Customer booking page with packages and times',
      },
      {
        id: 'deposits',
        title: 'Deposits & payments',
        line: 'Lock the slot on Pro.',
        screenshotSrc: null,
        screenshotAlt: 'Deposit checkout on the booking page',
      },
      {
        id: 'crm',
        title: 'CRM',
        line: 'Client, vehicle, visit history.',
        screenshotSrc: null,
        screenshotAlt: 'Client list with vehicles',
      },
      {
        id: 'sms',
        title: 'SMS updates',
        line: 'Booked. Reminder. On the way.',
        screenshotSrc: null,
        screenshotAlt: 'Customer SMS job updates',
      },
      {
        id: 'app',
        title: 'Mobile app',
        line: 'iOS and Android for the shop.',
        screenshotSrc: null,
        screenshotAlt: 'ServiceLink for Business on a phone',
      },
    ],
  },
  mobileOrShop: {
    heading: 'Mobile or shop',
    sub: 'Same booking page. Different place they meet you.',
    mobile: {
      title: 'Service area',
      line: 'They enter the driveway. You set the radius.',
    },
    shop: {
      title: 'Shop address',
      line: 'They come to you. Address on the page.',
    },
  },
  comparison: {
    heading: 'Vs a generic booking tool',
    sub: 'Built around detailing jobs — not office meetings.',
    rows: [
      { feature: 'Vehicle-size prices', servicelink: true, generic: false },
      { feature: 'Packages & add-ons', servicelink: true, generic: false },
      { feature: 'Deposit at checkout', servicelink: true, generic: false },
      {
        feature: 'Customer picks an open slot',
        servicelink: true,
        generic: true,
      },
      {
        feature: 'Service area or shop address',
        servicelink: true,
        generic: false,
      },
      { feature: 'CRM from every booking', servicelink: true, generic: false },
    ],
    links: [
      {
        href: ROUTES.RESOURCE_GUIDE(
          'best-booking-apps-and-crms-for-mobile-detailers'
        ),
        label: 'Best booking apps & CRMs (2026)',
      },
      {
        href: ROUTES.RESOURCE_GUIDE(
          'square-appointments-alternative-mobile-detailers'
        ),
        label: 'Square Appointments alternative',
      },
    ],
  },
  faqs: [
    {
      question: 'Is ServiceLink auto detailing software or just a calendar?',
      answer:
        'It is auto detailing software: a public booking page, vehicle-size prices, a CRM, SMS job updates, and Team. The calendar is how customers pick an open slot — not the whole product.',
    },
    {
      question: 'Does it work for mobile detailing and a shop?',
      answer:
        'Yes. Mobile operators publish a service area. Shop operators publish an address. Same link, same CRM, deposits on Pro.',
    },
    {
      question: 'Do my customers need an app?',
      answer:
        'No. They book in the browser. You use the web or the iOS/Android apps.',
    },
    {
      question: 'Are deposits on the free plan?',
      answer:
        'No. Free is five lifetime appointments and a live booking link. Deposits, Tap to Pay, quotes, and invoices are on Pro at $20/month.',
    },
  ],
  cta: {
    heading: 'Start free. Put the link in your bio.',
    line: 'Five appointments. No card. Pro when you want deposits.',
  },
};
