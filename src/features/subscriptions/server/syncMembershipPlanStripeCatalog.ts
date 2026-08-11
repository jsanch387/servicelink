import { getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { SubscriptionCadenceUnit } from '../types/customerSubscriptionPlan';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  membershipPlanPricesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];

const CADENCE_UNITS = new Set<SubscriptionCadenceUnit>([
  'week',
  'month',
  'year',
]);

export type SyncMembershipPlanStripeCatalogResult =
  | { ok: true; plan: PlanRow; prices: PriceRow[] }
  | { ok: false; error: string };

function asStripeInterval(unit: string): SubscriptionCadenceUnit | null {
  if (CADENCE_UNITS.has(unit as SubscriptionCadenceUnit)) {
    return unit as SubscriptionCadenceUnit;
  }
  return null;
}

function productDescription(plan: PlanRow): string | undefined {
  const prose = plan.description?.trim() ?? '';
  if (!prose) return undefined;
  return prose.slice(0, 500);
}

function stripeErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    const message = (error as { message: string }).message.trim();
    if (message) return message;
  }
  return 'Could not sync plan with Stripe. Try again.';
}

async function archiveStripePriceBestEffort(
  stripe: Stripe,
  stripePriceId: string | null | undefined,
  requestId?: string
): Promise<void> {
  const id = stripePriceId?.trim();
  if (!id) return;
  try {
    await stripe.prices.update(id, { active: false });
  } catch (error) {
    logMemberships(requestId, 'warn', 'stripe.price_archive_failed', {
      stripePriceId: shortStripeIdForLog(id),
      reason: 'Could not archive Stripe price',
      ...stripeErrorForLogs(error),
    });
  }
}

async function archiveStripeProductBestEffort(
  stripe: Stripe,
  stripeProductId: string | null | undefined,
  requestId?: string
): Promise<void> {
  const id = stripeProductId?.trim();
  if (!id) return;
  try {
    await stripe.products.update(id, { active: false });
  } catch (error) {
    logMemberships(requestId, 'warn', 'stripe.product_archive_failed', {
      stripeProductId: shortStripeIdForLog(id),
      reason: 'Could not archive Stripe product',
      ...stripeErrorForLogs(error),
    });
  }
}

/**
 * Soft-delete cleanup: archive Product + Prices on the connected account.
 * Best-effort — DB soft-delete remains source of truth for the app.
 */
export async function archiveMembershipPlanStripeCatalog(
  stripeAccountId: string,
  stripeProductId: string | null | undefined,
  stripePriceIds: Array<string | null | undefined>,
  requestId?: string
): Promise<void> {
  const accountId = stripeAccountId.trim();
  if (!accountId) return;

  const stripe = getStripeConnectClient(accountId);
  for (const priceId of stripePriceIds) {
    await archiveStripePriceBestEffort(stripe, priceId, requestId);
  }
  await archiveStripeProductBestEffort(stripe, stripeProductId, requestId);
}

/**
 * Ensure the plan + cadence rows have Stripe Product / Price IDs on the
 * connected account. Creates a new Price when amount/interval no longer match.
 */
export async function syncMembershipPlanStripeCatalog(
  supabase: SupabaseClient<Database>,
  stripeAccountId: string,
  plan: PlanRow,
  prices: PriceRow[],
  requestId?: string
): Promise<SyncMembershipPlanStripeCatalogResult> {
  const accountId = stripeAccountId.trim();
  if (!accountId) {
    return { ok: false, error: 'Stripe Connect account is required.' };
  }
  if (!prices.length) {
    return { ok: false, error: 'Add at least one pricing option.' };
  }

  const stripe = getStripeConnectClient(accountId);
  const planMeta = {
    membership_plan_id: plan.id,
    business_id: plan.business_id,
  };

  let productId = plan.stripe_product_id?.trim() || null;
  let nextPlan = plan;

  try {
    if (productId) {
      try {
        await stripe.products.update(productId, {
          name: plan.name,
          description: productDescription(plan) ?? '',
          metadata: planMeta,
          active: true,
        });
      } catch (error) {
        logMemberships(requestId, 'warn', 'stripe.product_update_failed', {
          planId: shortIdForLog(plan.id),
          stripeProductId: shortStripeIdForLog(productId),
          reason: 'Product update failed; creating a new Product',
          ...stripeErrorForLogs(error),
        });
        productId = null;
      }
    }

    if (!productId) {
      const created = await stripe.products.create({
        name: plan.name,
        description: productDescription(plan),
        metadata: planMeta,
      });
      productId = created.id;

      const { data: updatedPlanData, error: planUpdateError } =
        await membershipPlansOf(supabase)
          .update({ stripe_product_id: productId })
          .eq('id', plan.id)
          .eq('business_id', plan.business_id)
          .select('*')
          .single();

      if (planUpdateError || !updatedPlanData) {
        logMemberships(requestId, 'error', 'stripe.product_id_persist_failed', {
          planId: shortIdForLog(plan.id),
          stripeProductId: shortStripeIdForLog(productId),
          reason: 'Created Stripe Product but failed to save id in DB',
          ...supabaseErrorForLogs(planUpdateError),
        });
        return {
          ok: false,
          error:
            planUpdateError?.message ?? 'Could not save Stripe product id.',
        };
      }
      nextPlan = updatedPlanData as PlanRow;
    } else {
      nextPlan = { ...plan, stripe_product_id: productId };
    }

    const nextPrices: PriceRow[] = [];

    for (const price of prices) {
      const interval = asStripeInterval(price.interval_unit);
      if (!interval) {
        return {
          ok: false,
          error: 'Invalid schedule option for Stripe.',
        };
      }

      const currency = (price.currency || 'usd').toLowerCase();
      let stripePriceId = price.stripe_price_id?.trim() || null;
      let needsNewPrice = !stripePriceId;

      if (stripePriceId) {
        try {
          const existing = await stripe.prices.retrieve(stripePriceId);
          const matches =
            existing.active !== false &&
            existing.unit_amount === price.price_cents &&
            existing.currency === currency &&
            existing.recurring?.interval === interval &&
            existing.recurring?.interval_count === price.interval_count &&
            (typeof existing.product === 'string'
              ? existing.product
              : existing.product?.id) === productId;

          if (!matches) {
            needsNewPrice = true;
            await archiveStripePriceBestEffort(
              stripe,
              stripePriceId,
              requestId
            );
          }
        } catch (error) {
          logMemberships(requestId, 'warn', 'stripe.price_retrieve_failed', {
            planId: shortIdForLog(plan.id),
            priceId: shortIdForLog(price.id),
            stripePriceId: shortStripeIdForLog(stripePriceId),
            reason: 'Price retrieve failed; creating a new Price',
            ...stripeErrorForLogs(error),
          });
          needsNewPrice = true;
          stripePriceId = null;
        }
      }

      if (needsNewPrice) {
        const createdPrice = await stripe.prices.create({
          product: productId,
          unit_amount: price.price_cents,
          currency,
          recurring: {
            interval,
            interval_count: price.interval_count,
          },
          metadata: {
            ...planMeta,
            membership_plan_price_id: price.id,
          },
        });
        stripePriceId = createdPrice.id;

        const { data: updatedPriceData, error: priceUpdateError } =
          await membershipPlanPricesOf(supabase)
            .update({ stripe_price_id: stripePriceId })
            .eq('id', price.id)
            .eq('business_id', plan.business_id)
            .select('*')
            .single();

        if (priceUpdateError || !updatedPriceData) {
          logMemberships(requestId, 'error', 'stripe.price_id_persist_failed', {
            planId: shortIdForLog(plan.id),
            priceId: shortIdForLog(price.id),
            stripePriceId: shortStripeIdForLog(stripePriceId),
            reason: 'Created Stripe Price but failed to save id in DB',
            ...supabaseErrorForLogs(priceUpdateError),
          });
          return {
            ok: false,
            error:
              priceUpdateError?.message ?? 'Could not save Stripe price id.',
          };
        }
        nextPrices.push(updatedPriceData as PriceRow);
      } else {
        nextPrices.push({
          ...price,
          stripe_price_id: stripePriceId,
        });
      }
    }

    return { ok: true, plan: nextPlan, prices: nextPrices };
  } catch (error) {
    logMemberships(requestId, 'error', 'stripe.sync_failed', {
      planId: shortIdForLog(plan.id),
      businessId: shortIdForLog(plan.business_id),
      stripeAccountId: shortStripeIdForLog(accountId),
      reason: stripeErrorMessage(error).slice(0, 120),
      ...stripeErrorForLogs(error),
    });
    return { ok: false, error: stripeErrorMessage(error) };
  }
}

/** Best-effort archive when a cadence row is removed on edit. */
export async function archiveRemovedMembershipStripePrices(
  stripeAccountId: string,
  prices: Array<Pick<PriceRow, 'stripe_price_id'>>,
  requestId?: string
): Promise<void> {
  const accountId = stripeAccountId.trim();
  if (!accountId || prices.length === 0) return;

  const stripe = getStripeConnectClient(accountId);
  for (const price of prices) {
    await archiveStripePriceBestEffort(
      stripe,
      price.stripe_price_id,
      requestId
    );
  }
}
