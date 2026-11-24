import { getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadMembershipShopTax,
  membershipSalesTaxForPrice,
  membershipStripeUnitAmount,
  membershipTaxColumns,
} from './membershipSalesTax';
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
import { syncMembershipPlanStripeCatalog } from './syncMembershipPlanStripeCatalog';

type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];
type PlanRow = Database['public']['Tables']['membership_plans']['Row'];

/**
 * New signups charge the shop's current tax. Existing subscriptions keep the
 * Stripe Price they already subscribed to.
 */
export async function ensureMembershipPriceIncludesShopTax(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    planId: string;
    priceId: string;
    stripeAccountId: string;
    requestId?: string;
  }
): Promise<
  | { ok: true; stripePriceId: string; taxCents: number; taxRateBps: number }
  | { ok: false; error: string }
> {
  const { data: priceData, error: priceError } = await membershipPlanPricesOf(
    supabase
  )
    .select('*')
    .eq('id', args.priceId)
    .eq('plan_id', args.planId)
    .eq('business_id', args.businessId)
    .maybeSingle();

  const price = priceData as PriceRow | null;
  if (priceError || !price) {
    logMemberships(args.requestId, 'error', 'checkout.price_load_failed', {
      businessId: shortIdForLog(args.businessId),
      priceId: shortIdForLog(args.priceId),
      ...supabaseErrorForLogs(priceError),
    });
    return { ok: false, error: 'Could not load pricing option.' };
  }

  const shop = await loadMembershipShopTax(supabase, args.businessId);
  const quote = membershipSalesTaxForPrice(price.price_cents, shop);
  const chargeCents = membershipStripeUnitAmount({
    priceCents: price.price_cents,
    taxCents: quote.taxCents,
  });
  const storedMatches =
    price.tax_cents === quote.taxCents &&
    price.tax_rate_bps === quote.rateBps &&
    Boolean(price.stripe_price_id?.trim());

  if (storedMatches && price.stripe_price_id) {
    try {
      const stripe = getStripeConnectClient(args.stripeAccountId);
      const existing = await stripe.prices.retrieve(price.stripe_price_id);
      if (existing.active !== false && existing.unit_amount === chargeCents) {
        return {
          ok: true,
          stripePriceId: price.stripe_price_id,
          taxCents: quote.taxCents,
          taxRateBps: quote.rateBps,
        };
      }
    } catch (error) {
      logMemberships(args.requestId, 'warn', 'checkout.price_retrieve_failed', {
        priceId: shortIdForLog(price.id),
        stripePriceId: shortStripeIdForLog(price.stripe_price_id),
        ...stripeErrorForLogs(error),
      });
    }
  }

  const taxColumns = membershipTaxColumns(price.price_cents, shop);
  const { error: updateError } = await membershipPlanPricesOf(supabase)
    .update(taxColumns)
    .eq('id', price.id)
    .eq('business_id', args.businessId);

  if (updateError) {
    logMemberships(args.requestId, 'error', 'checkout.tax_stamp_failed', {
      priceId: shortIdForLog(price.id),
      ...supabaseErrorForLogs(updateError),
    });
    return { ok: false, error: 'Could not update membership tax.' };
  }

  const { data: planData, error: planError } = await membershipPlansOf(supabase)
    .select('*')
    .eq('id', args.planId)
    .eq('business_id', args.businessId)
    .maybeSingle();
  const plan = planData as PlanRow | null;
  if (planError || !plan) {
    return { ok: false, error: 'Could not load plan.' };
  }

  const { data: allPrices, error: pricesError } = await membershipPlanPricesOf(
    supabase
  )
    .select('*')
    .eq('plan_id', args.planId)
    .eq('business_id', args.businessId);

  if (pricesError || !allPrices) {
    return { ok: false, error: 'Could not load pricing.' };
  }

  const sync = await syncMembershipPlanStripeCatalog(
    supabase,
    args.stripeAccountId,
    plan,
    allPrices as PriceRow[],
    args.requestId
  );
  if (!sync.ok) return { ok: false, error: sync.error };

  const synced = sync.prices.find(row => row.id === price.id);
  const stripePriceId = synced?.stripe_price_id?.trim() ?? '';
  if (!stripePriceId) {
    return { ok: false, error: 'This plan is not ready for checkout yet.' };
  }
  return {
    ok: true,
    stripePriceId,
    taxCents: quote.taxCents,
    taxRateBps: quote.rateBps,
  };
}
