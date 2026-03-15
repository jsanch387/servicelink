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
    description:
      'Perfect for new businesses and side hustles testing the waters.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    description: 'For busy pros who need unlimited bookings and full control.',
  },
} as const;

/** Free plan: max bookings per month before upgrade prompt */
export const FREE_BOOKINGS_LIMIT = 5;

/** Free plan: max portfolio images (edit + public display). */
export const FREE_MAX_PORTFOLIO_IMAGES = 4;
/** Pro plan: max portfolio images (edit + public display). */
export const PRO_MAX_PORTFOLIO_IMAGES = 8;

/** Pro plan feature list for upgrade and pricing UIs */
export const PRO_FEATURES = [
  'Unlimited bookings',
  'More gallery images',
  'Priority support',
  'Future features',
] as const;

/** localStorage key: set after user dismisses the post-upgrade welcome modal (show once). */
export const PRO_WELCOME_MODAL_SEEN_KEY = 'servicelink_pro_welcome_seen';
