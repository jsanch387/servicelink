/**
 * Maps open Stripe subscriptions to the billing action shown on Upgrade and Settings.
 * Server-safe pure logic. The Stripe lookup lives in resolvePlatformBillingAction.
 */

import type { PlatformBillingAction } from '../types';
import {
  decideProCheckoutAction,
  type OpenSubscriptionRef,
} from './openPlatformSubscriptions';

const PAYMENT_RETRY_STATUSES = new Set([
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
]);

export function billingActionFromOpenSubscriptions(
  openSubs: ReadonlyArray<OpenSubscriptionRef>,
  profileSubscriptionId?: string | null
): PlatformBillingAction {
  const decision = decideProCheckoutAction(openSubs, profileSubscriptionId);
  if (decision.action === 'block_healthy') return 'manage';
  if (decision.action === 'resume') return 'update_payment';
  return 'checkout';
}

/** Used when Stripe cannot be listed. Stored status is a fallback, not the live check. */
export function billingActionFromProfileStatus(
  subscriptionStatus: string | null | undefined
): PlatformBillingAction {
  const status = subscriptionStatus?.trim() ?? '';
  if (status === 'active' || status === 'trialing') return 'manage';
  if (PAYMENT_RETRY_STATUSES.has(status)) return 'update_payment';
  return 'checkout';
}
