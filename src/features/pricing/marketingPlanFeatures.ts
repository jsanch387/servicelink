import type { ProFeatureItem } from './types';
import {
  FREE_BOOKINGS_LIMIT,
  FREE_MAX_PORTFOLIO_IMAGES,
  PRO_MAX_PORTFOLIO_IMAGES,
} from './types';

/** Feature bullets for Free tier on marketing / upgrade plan cards. */
export const MARKETING_FREE_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: `${FREE_BOOKINGS_LIMIT} online bookings`, highlight: true },
  { text: 'Shareable booking page & online scheduling' },
  { text: 'Services, availability calendar & dashboard' },
  { text: 'Client CRM & visit history' },
  { text: `Up to ${FREE_MAX_PORTFOLIO_IMAGES} gallery photos` },
];

/** Same as marketing Free list — used on public `/pricing`. */
export const PUBLIC_PRICING_FREE_PLAN_FEATURES = MARKETING_FREE_PLAN_FEATURES;

/** Shown on Pro plan cards and comparison table. */
export const PRO_TAP_TO_PAY_FEATURE_TEXT =
  'Tap to Pay on iPhone — customers tap their card or phone to pay you';

/** Feature bullets for Pro tier on marketing / upgrade plan cards. */
export const MARKETING_PRO_PLAN_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings on your public page', highlight: true },
  {
    text: PRO_TAP_TO_PAY_FEATURE_TEXT,
    highlight: true,
  },
  { text: 'Accept card payments & collect deposits', highlight: true },
  { text: 'Client CRM — notes, history, and check-ins' },
  { text: 'Create and accept quote requests' },
  { text: 'Email confirmations for you and clients' },
  { text: 'Multiple prices per service (sedan, SUV, etc.)' },
  {
    text: `Verified badge & up to ${PRO_MAX_PORTFOLIO_IMAGES} gallery photos`,
  },
];

/** Canonical Pro bullets shown on public `/pricing` and dashboard reactivation paywall. */
export const PUBLIC_PRICING_PRO_PLAN_FEATURES = MARKETING_PRO_PLAN_FEATURES;

/**
 * Post-onboarding soft CTA: top Pro unlocks without the support line
 * (keeps the nudge about the product, not service tiers).
 */
export const POST_ONBOARDING_PRO_NUDGE_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings', highlight: true },
  {
    text: PRO_TAP_TO_PAY_FEATURE_TEXT,
    highlight: true,
  },
  { text: 'Accept payments & deposits in the app', highlight: true },
  { text: 'Client CRM, quotes, and email confirmations' },
  { text: 'Multiple price options per service' },
  { text: 'Verified badge & more gallery photos' },
];

/** Post-upgrade welcome modal — core unlocks (no support line). */
export const PRO_WELCOME_MODAL_FEATURES: readonly ProFeatureItem[] = [
  { text: 'Unlimited bookings on your public page', highlight: true },
  {
    text: PRO_TAP_TO_PAY_FEATURE_TEXT,
    highlight: true,
  },
  { text: 'Accept card payments & collect deposits', highlight: true },
  { text: 'Client CRM, quote requests, and check-ins' },
  { text: 'Email confirmations for you and clients' },
  { text: 'Multiple price options per service' },
  {
    text: `Verified badge & up to ${PRO_MAX_PORTFOLIO_IMAGES} gallery photos`,
  },
];
