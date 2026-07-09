/**
 * Plan identifiers for pricing/subscription.
 * UI-only for now; backend subscription logic can plug in later.
 */
export type PlanId = 'free' | 'pro';

/** Pro subscription billing cadence shown on pricing and at checkout. */
export type BillingInterval = 'month' | 'year';

/** List price for new Pro yearly signups ($20/mo × 12 − 2 months). */
export const PRO_YEARLY_LIST_PRICE = '$200';

/** Shown on yearly toggle / plan card (vs $240/yr at monthly list price). */
export const PRO_YEARLY_SAVINGS_LABEL = '2 months free';

export interface PlanInfo {
  id: PlanId;
  name: string;
  price: string;
  description: string;
}

export const PLANS: Record<PlanId, PlanInfo> = {
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
      'For pros who want unlimited bookings, iPhone payments at the job, and more.',
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

/** Pro plan feature list for upgrade and pricing UIs (first = main reason, highlight = star + bold). */
export const PRO_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  {
    text: 'Tap to Pay on iPhone — customers tap their card or phone to pay you',
    highlight: true,
  },
  { text: 'Accept card payments & collect deposits', highlight: true },
  { text: 'Client CRM, quotes, and email confirmations' },
  { text: 'Multiple price options per service' },
  { text: 'Verified badge & more gallery photos' },
];

/** localStorage key: set after user dismisses the post-upgrade welcome modal (show once). */
export const PRO_WELCOME_MODAL_SEEN_KEY = 'servicelink_pro_welcome_seen';
/** localStorage key: set after user dismisses the post-onboarding "Try Pro" modal (show once). */
export const ONBOARDING_PRO_MODAL_SEEN_KEY =
  'servicelink_onboarding_pro_modal_seen';
