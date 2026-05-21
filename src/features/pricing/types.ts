/**
 * Plan identifiers for pricing/subscription.
 * UI-only for now; backend subscription logic can plug in later.
 */
export type PlanId = 'free' | 'pro';

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
    price: '$10',
    description: 'For busy pros who need unlimited bookings and full control.',
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
  { text: 'Verified profile badge' },
  { text: 'More images' },
  { text: 'Multiple price options per service' },
  { text: 'Priority support' },
];

/** localStorage key: set after user dismisses the post-upgrade welcome modal (show once). */
export const PRO_WELCOME_MODAL_SEEN_KEY = 'servicelink_pro_welcome_seen';
/** localStorage key: set after user dismisses the post-onboarding "Try Pro" modal (show once). */
export const ONBOARDING_PRO_MODAL_SEEN_KEY =
  'servicelink_onboarding_pro_modal_seen';
