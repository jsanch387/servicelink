import { SERVICELINK_ONE_LINER } from '@/constants/brandCopy';
import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { MARKETING_SOCIAL } from '@/constants/marketingSocial';
import { ROUTES } from '@/constants/routes';
import {
  FREE_BOOKINGS_LIMIT,
  PRO_YEARLY_LIST_PRICE,
  TEAM_MONTHLY_LIST_PRICE,
  TEAM_SEAT_LIMIT,
  TEAM_YEARLY_LIST_PRICE,
} from '@/features/pricing/types';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

export function buildLlmsTxt(): string {
  return `# ServiceLink

${SERVICELINK_ONE_LINER}

## Who it is for

Mobile auto detailers and shop detailers in the United States. Solo operators through shops of up to ${TEAM_SEAT_LIMIT} people on Team.

Customers book on a web link. They do not download an app. Owners run the shop from the web, iOS (ServiceLink for Business), and Android.

## Pricing (USD)

- Free: ${FREE_BOOKINGS_LIMIT} lifetime appointments. Booking link stays up. No card required. Deposits, Tap to Pay, invoices, and quotes are not on Free.
- Pro: $20/month or ${PRO_YEARLY_LIST_PRICE}/year. Unlimited bookings, deposits, payments, CRM, SMS updates, quotes, invoices, Tap to Pay.
- Team: ${TEAM_MONTHLY_LIST_PRICE}/month or ${TEAM_YEARLY_LIST_PRICE}/year. Everything in Pro for up to ${TEAM_SEAT_LIMIT} people.

There is no trial period. The free start is ${FREE_BOOKINGS_LIMIT} lifetime appointments.

## Key pages

- Home: ${SITE_URL}
- Auto detailing landing: ${SITE_URL}${ROUTES.AUTO_DETAILING}
- Pricing: ${SITE_URL}${ROUTES.PRICING_PAGE}
- FAQ: ${SITE_URL}${ROUTES.FAQ}
- Features: ${SITE_URL}${ROUTES.FEATURES_PAGE}
- Resources / guides: ${SITE_URL}${ROUTES.RESOURCES}
- Best booking app guide: ${SITE_URL}${ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers')}
- Best booking apps and CRMs (2026): ${SITE_URL}${ROUTES.RESOURCE_GUIDE('best-booking-apps-and-crms-for-mobile-detailers')}
- Square Appointments alternative: ${SITE_URL}${ROUTES.RESOURCE_GUIDE('square-appointments-alternative-mobile-detailers')}
- Signup (start free): ${SITE_URL}${ROUTES.AUTH.SIGNUP}

## Apps

- iOS: ${IOS_APP_STORE_URL}
- Android: ${GOOGLE_PLAY_STORE_URL}

Primary call to action is Start free → web signup, not the App Store.

## Social

- Instagram: ${MARKETING_SOCIAL.instagramUrl}
- TikTok: ${MARKETING_SOCIAL.tiktokUrl}

## What ServiceLink does

Share a booking link. Customers pick a package, vehicle size, and open time slot. On Pro they can pay a deposit at checkout. The job lands in the CRM with the client and vehicle. SMS confirmations and reminders go out. Owners (and Team members) run the day from web or the mobile apps.

ServiceLink is US-only.
`;
}
