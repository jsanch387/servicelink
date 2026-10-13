import { resolveBillingIntervalFromStripeSubscription } from '@/features/pricing/server/resolveSubscriptionBillingInterval';
import { portalProductsForPlanSwitch } from '@/features/pricing/server/portalProductsForPlanSwitch';
import { resolveStripeTeamPriceId } from '@/libs/stripe/resolveStripeTeamPriceId';
import type Stripe from 'stripe';

const PORTAL_CONFIG_PURPOSE = 'servicelink_team_switch';

function stripeId(
  value: string | { id: string } | null | undefined
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function teamSwitchPortalConfigurationId(
  stripe: Stripe,
  products: Array<{ product: string; prices: string[] }>
): Promise<string> {
  const features: Stripe.BillingPortal.ConfigurationCreateParams['features'] = {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: false },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'always_invoice',
      billing_cycle_anchor: 'unchanged',
      products,
    },
  };

  const existing = await stripe.billingPortal.configurations.list({
    limit: 100,
  });
  const match = existing.data.find(
    configuration =>
      configuration.active &&
      configuration.metadata?.purpose === PORTAL_CONFIG_PURPOSE
  );

  if (match) {
    const updated = await stripe.billingPortal.configurations.update(match.id, {
      features,
    });
    return updated.id;
  }

  const created = await stripe.billingPortal.configurations.create({
    name: 'ServiceLink Team plan change',
    metadata: { purpose: PORTAL_CONFIG_PURPOSE },
    features,
  });
  return created.id;
}

/**
 * Opens Stripe's hosted confirmation for a Pro → Team price change.
 * The subscription is not changed until the customer confirms the amount due.
 */
export async function createTeamSwitchConfirmSession(params: {
  stripe: Stripe;
  stripeSubscriptionId: string;
  returnUrl: string;
  successUrl: string;
}): Promise<
  { ok: true; url: string } | { ok: false; error: string; status: number }
> {
  const subId = params.stripeSubscriptionId.trim();
  if (!subId) {
    return { ok: false, error: 'No subscription to update', status: 409 };
  }

  let subscription: Stripe.Subscription;
  try {
    subscription = await params.stripe.subscriptions.retrieve(subId);
  } catch (err) {
    console.error(
      '[pricing] retrieve subscription for Team confirm failed',
      err
    );
    return {
      ok: false,
      error: 'Could not open the Team confirmation page. Try again.',
      status: 409,
    };
  }

  if (subscription.items.data.length !== 1) {
    return {
      ok: false,
      error:
        'This subscription has more than one item. Manage billing in Settings.',
      status: 409,
    };
  }

  const item = subscription.items.data[0];
  if (!item?.id || !item.price?.id) {
    return {
      ok: false,
      error: 'Could not open the Team confirmation page.',
      status: 409,
    };
  }

  const interval = resolveBillingIntervalFromStripeSubscription(subscription);
  const teamPriceId = resolveStripeTeamPriceId(interval);
  if (!teamPriceId) {
    return {
      ok: false,
      error:
        interval === 'year'
          ? 'Yearly Team checkout is not configured yet'
          : 'Team checkout is not configured',
      status: 500,
    };
  }

  const customerId = stripeId(subscription.customer);
  if (!customerId) {
    return {
      ok: false,
      error: 'Could not open the Team confirmation page.',
      status: 409,
    };
  }

  if (item.price.id === teamPriceId) {
    return {
      ok: false,
      error: 'This subscription is already on Team.',
      status: 409,
    };
  }

  let teamPrice: Stripe.Price;
  try {
    teamPrice = await params.stripe.prices.retrieve(teamPriceId);
  } catch (err) {
    console.error('[pricing] retrieve Team price for confirm failed', err);
    return {
      ok: false,
      error: 'Could not open the Team confirmation page. Try again.',
      status: 500,
    };
  }

  const teamProductId = stripeId(teamPrice.product);
  if (!teamProductId) {
    return {
      ok: false,
      error: 'Could not open the Team confirmation page.',
      status: 500,
    };
  }

  let configurationId: string;
  try {
    configurationId = await teamSwitchPortalConfigurationId(
      params.stripe,
      portalProductsForPlanSwitch({
        nextProductId: teamProductId,
        nextPriceId: teamPriceId,
      })
    );
  } catch (err) {
    console.error('[pricing] Team confirm portal configuration failed', err);
    return {
      ok: false,
      error: 'Could not open the Team confirmation page. Try again.',
      status: 500,
    };
  }

  try {
    const session = await params.stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: configurationId,
      return_url: params.returnUrl,
      flow_data: {
        type: 'subscription_update_confirm',
        subscription_update_confirm: {
          subscription: subscription.id,
          items: [
            {
              id: item.id,
              price: teamPriceId,
              quantity: item.quantity ?? 1,
            },
          ],
        },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: params.successUrl },
        },
      },
    });

    if (!session.url) {
      return {
        ok: false,
        error: 'Could not open the Team confirmation page.',
        status: 500,
      };
    }

    return { ok: true, url: session.url };
  } catch (err) {
    console.error('[pricing] Team confirm portal session failed', err);
    return {
      ok: false,
      error: 'Could not open the Team confirmation page. Try again.',
      status: 500,
    };
  }
}
