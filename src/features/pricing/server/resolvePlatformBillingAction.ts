/**
 * Live billing action for Upgrade and Settings.
 * No Stripe customer → checkout (first subscribe, or a fully ended plan).
 * Open active/trialing sub → manage. Open past_due/unpaid/incomplete/paused → update payment.
 */

import { getStripePlatform } from '@/libs/stripe';
import type { PlatformBillingAction } from '../types';
import { listOpenPlatformSubscriptions } from './openPlatformSubscriptions';
import {
  billingActionFromOpenSubscriptions,
  billingActionFromProfileStatus,
} from './platformBillingAction';

export async function resolvePlatformBillingAction(input: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}): Promise<PlatformBillingAction> {
  const customerId = input.stripeCustomerId?.trim() ?? '';
  if (!customerId) return 'checkout';

  try {
    const stripe = getStripePlatform();
    const openSubs = await listOpenPlatformSubscriptions(stripe, customerId);
    return billingActionFromOpenSubscriptions(
      openSubs,
      input.stripeSubscriptionId
    );
  } catch (err) {
    console.error('[pricing] resolvePlatformBillingAction failed', err);
    return billingActionFromProfileStatus(input.subscriptionStatus);
  }
}
