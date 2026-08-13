/**
 * Cadence unit for a subscription option.
 * Maps cleanly to Stripe Price `recurring.interval` (+ `interval_count`).
 */
export type SubscriptionCadenceUnit = 'week' | 'month' | 'year';

/**
 * One billing cadence an owner offers on a plan
 * (e.g. weekly, every 2 weeks, monthly).
 */
export interface SubscriptionCadenceOption {
  id: string;
  /** Stripe-style interval unit. */
  intervalUnit: SubscriptionCadenceUnit;
  /** Stripe-style interval count (1 = weekly, 2 = every 2 weeks). */
  intervalCount: number;
  /** Price charged each billing period, in cents. */
  priceCents: number;
  /** Pre-select this option when the card loads. */
  isDefault?: boolean;
}

/**
 * Customer-facing subscription plan (owner-created).
 * Pure UI shape for now — backend/API will own persistence later.
 */
export interface CustomerSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  /** How long each visit lasts (minutes) — used for public slotting. */
  visitDurationMinutes?: number;
  /** Cadences the customer can choose from (at least one). */
  cadenceOptions: SubscriptionCadenceOption[];
  /** Short benefit bullets — keep to 3–4 for easy scanning. */
  benefits: string[];
  /** Optional highlight for the recommended / most popular plan. */
  isPopular?: boolean;
}

/** @deprecated Prefer SubscriptionCadenceUnit + intervalCount. */
export type SubscriptionBillingInterval = 'week' | 'month' | 'quarter' | 'year';
