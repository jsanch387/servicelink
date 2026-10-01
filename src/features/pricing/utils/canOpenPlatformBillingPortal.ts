import type { PlanId, PlatformBillingAction } from '../types';

export type PlanSectionBillingCta = 'manage' | 'upgrade' | 'pay_now';

/**
 * Settings billing / Stripe Customer Portal should stay available after Pro
 * access is revoked. Payment failure sets `subscription_tier` to free while
 * `stripe_customer_id` (and often `subscription_status: past_due`) remain.
 */
export function canOpenPlatformBillingPortal(input: {
  planId?: PlanId | null;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  billingAction?: PlatformBillingAction;
}): boolean {
  if (input.planId === 'pro') return true;
  if (input.billingAction === 'manage') return true;
  if (input.subscriptionStatus?.trim() === 'past_due') return true;
  return Boolean(input.stripeCustomerId?.trim());
}

/** Which Settings plan-card actions to show for this account. */
export function planSectionBillingCtas(input: {
  planId?: PlanId | null;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  billingAction?: PlatformBillingAction;
}): readonly PlanSectionBillingCta[] {
  const planId = input.planId ?? 'free';
  const billingAction = input.billingAction ?? 'checkout';
  const canManage = canOpenPlatformBillingPortal({
    ...input,
    planId,
    billingAction,
  });

  const ctas: PlanSectionBillingCta[] = [];
  if (canManage) ctas.push('manage');
  if (planId !== 'pro' && billingAction === 'checkout') ctas.push('upgrade');
  if (!canManage && billingAction === 'update_payment') ctas.push('pay_now');
  return ctas;
}
