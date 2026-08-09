import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';

/**
 * Temporary mock plans so we can iterate on public-profile UX.
 * Remove once owner-created plans load from the API.
 *
 * Cadence options mirror how Stripe Prices work (interval + interval_count).
 */
export const MOCK_PUBLIC_SUBSCRIPTION_PLANS: CustomerSubscriptionPlan[] = [
  {
    id: 'mock-exterior-wash',
    name: 'Exterior Wash',
    description:
      'Keep your vehicle looking sharp between bigger details with a thorough exterior wash on the cadence that fits your lifestyle. Each visit includes a hand wash, wheel and tire clean, and a quick dry so your car stays presentable week after week. Ideal for daily drivers, commuters, and anyone who wants a clean exterior without booking a full detail every time. Visits are scheduled in advance, and you can pause or cancel anytime from your confirmation email. Soft-touch wash mitts, pH-balanced soap, and spot-free rinse water help protect your paint while removing road film, pollen, and light dirt. Add this plan if you want reliable curb appeal with less back-and-forth scheduling.',
    isPopular: true,
    benefits: ['Hand wash & dry', 'Tire & wheel clean', 'Cancel anytime'],
    cadenceOptions: [
      {
        id: 'exterior-weekly',
        intervalUnit: 'week',
        intervalCount: 1,
        priceCents: 4500,
      },
      {
        id: 'exterior-biweekly',
        intervalUnit: 'week',
        intervalCount: 2,
        priceCents: 7900,
        isDefault: true,
      },
      {
        id: 'exterior-monthly',
        intervalUnit: 'month',
        intervalCount: 1,
        priceCents: 12900,
      },
    ],
  },
  {
    id: 'mock-interior-refresh',
    name: 'Interior Refresh',
    description:
      'A recurring interior tidy-up for busy drivers who want a clean cabin without a full detail every visit. We vacuum carpets and seats, wipe high-touch surfaces, empty visible trash, and leave the cabin smelling fresh. Perfect if kids, pets, or commute clutter pile up fast. Choose weekly or every two weeks depending on how hard your interior works.',
    benefits: [
      'Vacuum carpets & seats',
      'Wipe high-touch surfaces',
      'Fresh cabin finish',
    ],
    cadenceOptions: [
      {
        id: 'interior-weekly',
        intervalUnit: 'week',
        intervalCount: 1,
        priceCents: 5500,
      },
      {
        id: 'interior-biweekly',
        intervalUnit: 'week',
        intervalCount: 2,
        priceCents: 9500,
        isDefault: true,
      },
      {
        id: 'interior-monthly',
        intervalUnit: 'month',
        intervalCount: 1,
        priceCents: 15900,
      },
    ],
  },
  {
    id: 'mock-premium',
    name: 'Premium Detail',
    description: 'Full interior and exterior care on a set schedule.',
    benefits: [
      'Full detail each visit',
      'Interior vacuum & wipe-down',
      'Priority booking',
      'Member perks',
    ],
    cadenceOptions: [
      {
        id: 'premium-monthly',
        intervalUnit: 'month',
        intervalCount: 1,
        priceCents: 14900,
        isDefault: true,
      },
      {
        id: 'premium-quarterly',
        intervalUnit: 'month',
        intervalCount: 3,
        priceCents: 39900,
      },
    ],
  },
  {
    id: 'mock-deep-clean',
    name: 'Deep Clean',
    description: 'A thorough seasonal clean when you need less frequent care.',
    benefits: [
      'Deep clean each visit',
      'Clay bar & paint decon',
      'Interior shampoo',
    ],
    cadenceOptions: [
      {
        id: 'deep-quarterly',
        intervalUnit: 'month',
        intervalCount: 3,
        priceCents: 24900,
        isDefault: true,
      },
    ],
  },
];
