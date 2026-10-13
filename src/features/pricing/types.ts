/**
 * Account plan stored on the profile. Team billing is not a profile tier yet.
 */
export type PlanId = 'free' | 'pro';

/** Plans shown on marketing pricing. Includes Team before checkout exists. */
export type MarketingPlanId = PlanId | 'team';

/** Pro subscription billing cadence shown on pricing and at checkout. */
export type BillingInterval = 'month' | 'year';

/**
 * What the upgrade card and Settings billing should do for this account.
 * Derived from open Stripe subscriptions, not only the stored Free/Pro label.
 */
export type PlatformBillingAction = 'checkout' | 'manage' | 'update_payment';

/** List price for new Pro yearly signups ($20/mo × 12 − 2 months). */
export const PRO_YEARLY_LIST_PRICE = '$200';

/**
 * Team is Pro for more than one person. Yearly matches Pro: $60/mo × 12 − 2 months.
 * Seat cap is the people who can use the shop, including the owner.
 */
export const TEAM_MONTHLY_LIST_PRICE = '$60';
export const TEAM_YEARLY_LIST_PRICE = '$600';
export const TEAM_SEAT_LIMIT = 4;

/** Shown on yearly toggle / plan card (vs $240/yr at monthly list price). */
export const PRO_YEARLY_SAVINGS_LABEL = '2 months free';

export interface PlanInfo {
  id: MarketingPlanId;
  name: string;
  price: string;
  description: string;
}

export const PLANS: Record<MarketingPlanId, PlanInfo> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'For people testing the waters and getting started.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$20',
    description:
      'For pros who want unlimited bookings and the tools to get paid.',
  },
  team: {
    id: 'team',
    name: 'Team',
    price: TEAM_MONTHLY_LIST_PRICE,
    description: `Everything in Pro, for up to ${TEAM_SEAT_LIMIT} people on the shop.`,
  },
} as const;

/** Free plan: max lifetime public bookings per business before upgrade (Pro = unlimited). */
export const FREE_BOOKINGS_LIMIT = 5;

/** Free plan: max services per business (dashboard + onboarding); existing businesses with more may keep them but cannot add beyond that cap unless Pro. */
export const FREE_MAX_SERVICES = 5;

/** Shown when a Free user hits the service limit (UI + API errors). */
export const FREE_TIER_SERVICE_LIMIT_USER_MESSAGE =
  'Free plan includes up to 5 services. Upgrade to Pro to add more.';

/** Free plan: max portfolio images (edit + public display). */
export const FREE_MAX_PORTFOLIO_IMAGES = 4;
/** Pro plan: max portfolio images (edit + public display). */
export const PRO_MAX_PORTFOLIO_IMAGES = 8;

/** Pro plan feature item (highlight = main reason to upgrade, e.g. bold). */
export interface ProFeatureItem {
  text: string;
  highlight?: boolean;
}

/** Short Pro pitch shared with upgrade surfaces. */
export const PRO_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  { text: 'SMS confirmations and reminders', highlight: true },
  { text: 'Payments, deposits, and Tap to Pay', highlight: true },
  { text: 'Invoices and quotes' },
  { text: 'Subscriptions for repeat clients' },
  { text: 'Run sales and promotions' },
];

/** localStorage key: set after user dismisses the post-upgrade welcome modal (show once). */
export const PRO_WELCOME_MODAL_SEEN_KEY = 'servicelink_pro_welcome_seen';
/** localStorage key: set after user dismisses the post-onboarding "Try Pro" modal (show once). */
export const ONBOARDING_PRO_MODAL_SEEN_KEY =
  'servicelink_onboarding_pro_modal_seen';
