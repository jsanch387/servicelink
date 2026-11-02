import type { ProFeatureItem } from './types';
import { FREE_BOOKINGS_LIMIT, PRO_FEATURES, TEAM_SEAT_LIMIT } from './types';

/** Feature bullets for Free on marketing and upgrade plan cards. */
export const MARKETING_FREE_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Booking link you keep', highlight: true },
  {
    text: `${FREE_BOOKINGS_LIMIT} appointments to try it`,
    highlight: true,
  },
  { text: 'SMS and email' },
  { text: 'Page stays up after those are used' },
];

/** Same as marketing Free list — used on public `/pricing`. */
export const PUBLIC_PRICING_FREE_PLAN_FEATURES = MARKETING_FREE_PLAN_FEATURES;

/**
 * Pro bullets on public `/pricing` and the upgrade screen.
 * Matches the comparison table. Modals keep the shorter {@link PRO_FEATURES} pitch.
 */
export const MARKETING_PRO_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  { text: 'Calendar' },
  { text: 'Unlimited services' },
  { text: 'Multiple price options', highlight: true },
  { text: 'Client list' },
  { text: 'SMS confirmations and reminders', highlight: true },
  { text: 'Payments, deposits, and Tap to Pay', highlight: true },
  { text: 'Invoices' },
  { text: 'Quotes' },
  { text: 'Subscriptions for repeat clients' },
  { text: 'Run sales and promotions' },
];

/** Canonical Pro bullets shown on public `/pricing` and the upgrade screen. */
export const PUBLIC_PRICING_PRO_PLAN_FEATURES = MARKETING_PRO_PLAN_FEATURES;

/** Feature bullets for Team on the public pricing screen. */
export const MARKETING_TEAM_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Everything in Pro', highlight: true },
  {
    text: `Up to ${TEAM_SEAT_LIMIT} people on the shop`,
    highlight: true,
  },
  { text: 'Mobile app access' },
  { text: 'Teammates run jobs in the app' },
  { text: 'Assign work from the board' },
];

/** Canonical Team bullets shown on public `/pricing`. */
export const PUBLIC_PRICING_TEAM_PLAN_FEATURES = MARKETING_TEAM_PLAN_FEATURES;

/** Post-onboarding soft CTA. Short Pro pitch, not the full pricing card. */
export const POST_ONBOARDING_PRO_NUDGE_FEATURES = PRO_FEATURES;

/** Post-upgrade welcome modal. Short Pro pitch, not the full pricing card. */
export const PRO_WELCOME_MODAL_FEATURES = PRO_FEATURES;
