/**
 * Stripe subscription statuses that still grant billed Pro access.
 * Exported for webhook sync so `subscription_tier` stays aligned with Stripe.
 */
export const STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO = new Set([
  'active',
  'trialing',
]);

/**
 * Owner has entered the Stripe subscription lifecycle (customer/subscription row
 * or a synced non-empty `subscription_status`). Matches dashboard middleware
 * so “grandfathered free” and public profile visibility stay aligned.
 */
export function hasStripeBillingHistory(
  stripeCustomerId: string | null | undefined,
  stripeSubscriptionId: string | null | undefined,
  subscriptionStatus: string | null | undefined
): boolean {
  return Boolean(
    stripeCustomerId?.trim() ||
      stripeSubscriptionId?.trim() ||
      subscriptionStatus?.trim()
  );
}

/**
 * Dashboard paywall: only when the profile is still **pro** but Stripe does not
 * grant access (e.g. `past_due`, canceled while tier not yet synced). Users
 * downgraded to **free** after cancel keep full Free app access even if
 * `stripe_customer_id` / `subscription_status` remain set.
 */
export function needsPaidProResubscribeForDashboard(
  subscriptionTier: string | null | undefined,
  subscriptionStatus: string | null | undefined,
  stripeSubscriptionId: string | null | undefined,
  stripeCustomerId: string | null | undefined
): boolean {
  const tier = (subscriptionTier ?? '').trim().toLowerCase();
  if (tier !== 'pro') return false;
  return hasStripeBillingHistory(
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus
  );
}

/**
 * Whether this profile is tied to a paying Stripe subscription (vs comped/manual Pro).
 */
function hasStripeBillingSubscription(
  stripeSubscriptionId: string | null | undefined
): boolean {
  return Boolean(stripeSubscriptionId?.trim());
}

/**
 * Determines if the user has effective Pro access.
 *
 * **Comped / early-adopter Pro:** `subscription_tier === 'pro'`, **no**
 * `stripe_subscription_id`, and **no** `stripe_customer_id` (never had a Stripe
 * customer). Ignores period/status. If they ever had a Stripe customer (`cus_…`)
 * but no subscription id (webhook lag or bad row), treat as **not** Pro so
 * former subscribers cannot keep Pro by a stale `pro` tier.
 *
 * **Paying customers:** Must have `subscription_tier === 'pro'` and Stripe
 * `subscription_status` in {`active`, `trialing`}, or a **null/empty** status
 * during migration (temporary grace). Any other known status (`past_due`,
 * `unpaid`, `canceled`, …) revokes access. Period end is **not** used for
 * access for billed users—Stripe status is the source of truth (including
 * “stay active until the period ends” while cancel_at_period_end is pending).
 * Missing `subscription_current_period_end` does not revoke Pro for paying users.
 */
export function isProAccess(
  subscriptionTier: string | null | undefined,
  /** Retained for API compatibility; access for billed users does not depend on this field. */
  _subscriptionCurrentPeriodEnd: string | null | undefined,
  subscriptionStatus?: string | null,
  stripeSubscriptionId?: string | null,
  /** When set, no sub id + Stripe customer id ⇒ not manual comped Pro. */
  stripeCustomerId?: string | null
): boolean {
  if (subscriptionTier !== 'pro') return false;

  if (!hasStripeBillingSubscription(stripeSubscriptionId)) {
    if (stripeCustomerId != null && stripeCustomerId.trim() !== '') {
      return false;
    }
    return true;
  }

  if (
    subscriptionStatus != null &&
    subscriptionStatus !== '' &&
    !STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(subscriptionStatus)
  ) {
    return false;
  }

  return true;
}

/**
 * Pro gate for **public quote intake** (header CTA, `/[slug]/quote`, `POST /api/public/quote-request`).
 *
 * Stricter than {@link isProAccess} when the owner has a Stripe subscription id: status must be
 * explicitly `active` or `trialing`. Empty/missing status does **not** grant access, so churned
 * or lagging webhooks do not expose “Request quote” while {@link isProAccess} may still grant app
 * access during migration gaps.
 *
 * **Comped / manual Pro** (tier `pro`, no `stripe_subscription_id`, no `stripe_customer_id`) still
 * matches {@link isProAccess} and remains allowed here.
 */
export function isProAccessForPublicQuoteRequests(
  subscriptionTier: string | null | undefined,
  /** Retained for API symmetry with {@link isProAccess}. */
  _subscriptionCurrentPeriodEnd: string | null | undefined,
  subscriptionStatus?: string | null,
  stripeSubscriptionId?: string | null,
  stripeCustomerId?: string | null
): boolean {
  if (subscriptionTier !== 'pro') return false;

  if (!hasStripeBillingSubscription(stripeSubscriptionId)) {
    if (stripeCustomerId != null && stripeCustomerId.trim() !== '') {
      return false;
    }
    return true;
  }

  const st = (subscriptionStatus ?? '').trim();
  return STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(st);
}

const STRIPE_SUBSCRIPTION_STATUSES_ENDED_FOR_FREE_TIER_CAP = new Set([
  'canceled',
  'incomplete_expired',
]);

/**
 * Broader than {@link isProAccess}: used only for the **lifetime free-tier public
 * booking cap** and related public booking UX (e.g. price options on the book flow).
 *
 * Stripe webhooks may set `subscription_tier` to `free` while `subscription_status`
 * is `past_due` / `unpaid` / `incomplete` / `paused` — the subscription still exists.
 * Those owners should not be forced into the 5-booking Free cap or lose picker UX.
 *
 * **Not** for dashboard auth, Connect, or payments; keep using `isProAccess` there.
 */
export function isExemptFromFreeTierLifetimeBookingCap(
  subscriptionTier: string | null | undefined,
  subscriptionCurrentPeriodEnd: string | null | undefined,
  subscriptionStatus: string | null | undefined,
  stripeSubscriptionId: string | null | undefined,
  stripeCustomerId: string | null | undefined
): boolean {
  if (
    isProAccess(
      subscriptionTier,
      subscriptionCurrentPeriodEnd,
      subscriptionStatus,
      stripeSubscriptionId,
      stripeCustomerId
    )
  ) {
    return true;
  }

  const sid = stripeSubscriptionId?.trim();
  if (!sid) return false;

  const st = (subscriptionStatus ?? '').trim();
  if (STRIPE_SUBSCRIPTION_STATUSES_ENDED_FOR_FREE_TIER_CAP.has(st)) {
    return false;
  }

  return true;
}
