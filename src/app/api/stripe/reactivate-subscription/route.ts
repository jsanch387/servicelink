/**
 * POST /api/stripe/reactivate-subscription
 *
 * Charges the card already on file for an open past-due bill. Does not open
 * Checkout and does not replace the card. Manage billing stays on the portal.
 */

import {
  decideProCheckoutAction,
  listOpenPlatformSubscriptions,
} from '@/features/pricing/server/openPlatformSubscriptions';
import { chargeOpenPlatformSubscription } from '@/features/pricing/server/chargeOpenPlatformSubscription';
import { refreshProfilePlanFromStripeSubscription } from '@/features/pricing/server/refreshProfilePlanFromStripeSubscription';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getStripePlatform } from '@/libs/stripe';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[stripe:reactivate-subscription]';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { user, supabase } = auth;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileRow = profile as {
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
    } | null;
    const customerId = profileRow?.stripe_customer_id?.trim() ?? '';
    const subscriptionId = profileRow?.stripe_subscription_id?.trim() ?? '';

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'No billing account found' },
        { status: 400 }
      );
    }

    const stripe = getStripePlatform();
    const openSubs = await listOpenPlatformSubscriptions(stripe, customerId);
    const decision = decideProCheckoutAction(openSubs, subscriptionId);

    if (decision.action !== 'resume') {
      return NextResponse.json(
        {
          success: false,
          error: 'This subscription does not have an open bill to charge.',
        },
        { status: 409 }
      );
    }

    const charged = await chargeOpenPlatformSubscription(
      stripe,
      decision.subscriptionId
    );
    if (!charged.ok) {
      return NextResponse.json(
        { success: false, error: charged.error, url: charged.url },
        { status: charged.status }
      );
    }

    await refreshProfilePlanFromStripeSubscription(decision.subscriptionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`${LOG} failed`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
