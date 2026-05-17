import type { ProFeatureItem } from './types';
import {
  FREE_BOOKINGS_LIMIT,
  FREE_MAX_PORTFOLIO_IMAGES,
  PRO_MAX_PORTFOLIO_IMAGES,
} from './types';

/** Feature bullets for Free tier on marketing / upgrade plan cards. */
export const MARKETING_FREE_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: `${FREE_BOOKINGS_LIMIT} online bookings`, highlight: true },
  { text: 'Professional booking page & online scheduling' },
  { text: 'Services, availability calendar & dashboard' },
  { text: 'Client CRM, notes, and visit history' },
  { text: 'Email notifications for new bookings' },
  { text: `Up to ${FREE_MAX_PORTFOLIO_IMAGES} portfolio gallery images` },
];

/** Same as marketing Free list — used on public `/pricing`. */
export const PUBLIC_PRICING_FREE_PLAN_FEATURES = MARKETING_FREE_PLAN_FEATURES;

/** Feature bullets for Pro tier on marketing / upgrade plan cards. */
export const MARKETING_PRO_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  { text: 'Verified profile badge' },
  { text: `Up to ${PRO_MAX_PORTFOLIO_IMAGES} gallery images` },
  { text: 'Customer quote requests on your page' },
  { text: 'Multiple price options per service' },
  { text: 'Priority support' },
];

/** Canonical Pro bullets shown on public `/pricing` and dashboard reactivation paywall. */
export const PUBLIC_PRICING_PRO_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  { text: 'Take payments through the app' },
  { text: 'Client CRM, notes, and visit history' },
  { text: 'Quote requests on your public profile' },
  { text: 'Multiple price options per service' },
  { text: 'More gallery photos and verified badge' },
];

/**
 * Post-onboarding soft CTA: same practical benefits as marketing Pro, without
 * the support line (keeps the nudge about the product, not service tiers).
 */
export const POST_ONBOARDING_PRO_NUDGE_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  { text: 'Verified profile badge' },
  { text: `Up to ${PRO_MAX_PORTFOLIO_IMAGES} gallery images` },
  { text: 'Customer quote requests on your page' },
  { text: 'Multiple price options per service' },
];

/** Post-upgrade welcome modal — core unlocks (no support line). */
export const PRO_WELCOME_MODAL_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings on your public page', highlight: true },
  { text: 'Take payments through the app', highlight: true },
  { text: 'Verified badge on your booking link' },
  {
    text: `Up to ${PRO_MAX_PORTFOLIO_IMAGES} gallery images on your booking page`,
  },
  { text: 'Multiple price options per service' },
  { text: 'Customer quote requests on your page' },
];
