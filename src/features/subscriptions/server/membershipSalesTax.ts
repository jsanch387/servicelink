import { quotePublicBookingSalesTax } from '@/features/availability/booking/utils/publicBookingSalesTax';
import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionCadenceOption } from '../types/customerSubscriptionPlan';

export type MembershipShopTax = {
  taxEnabled: boolean;
  taxRateBps: number;
};

/** Current shop rate. Plan saves and checkout recompute tax from this. */
export async function loadMembershipShopTax(
  supabase: SupabaseClient,
  businessId: string
): Promise<MembershipShopTax> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('payment_settings')
    .select('tax_enabled, tax_rate_bps')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('membership sales tax settings:', error);
    return { taxEnabled: false, taxRateBps: 0 };
  }

  return {
    taxEnabled: data?.tax_enabled === true,
    taxRateBps: typeof data?.tax_rate_bps === 'number' ? data.tax_rate_bps : 0,
  };
}

export function membershipSalesTaxForPrice(
  priceCents: number,
  shop: MembershipShopTax
) {
  return quotePublicBookingSalesTax({
    priceAfterDiscountCents: priceCents,
    taxEnabled: shop.taxEnabled,
    taxRateBps: shop.taxRateBps,
  });
}

/** What Stripe should charge for this cadence. Tax sits on top of the plan price. */
export function membershipStripeUnitAmount(input: {
  priceCents: number;
  taxCents: number;
}): number {
  return (
    Math.max(0, Math.round(input.priceCents)) +
    Math.max(0, Math.round(input.taxCents))
  );
}

export function membershipTaxColumns(
  priceCents: number,
  shop: MembershipShopTax
): { tax_rate_bps: number; tax_cents: number } {
  const quote = membershipSalesTaxForPrice(priceCents, shop);
  return { tax_rate_bps: quote.rateBps, tax_cents: quote.taxCents };
}

export function withMembershipCadenceTax(
  options: SubscriptionCadenceOption[],
  shop: MembershipShopTax
): SubscriptionCadenceOption[] {
  return options.map(option => {
    const quote = membershipSalesTaxForPrice(option.priceCents, shop);
    return {
      ...option,
      taxCents: quote.taxCents,
      taxRateBps: quote.rateBps,
    };
  });
}

export function membershipTaxLabel(rateBps: number): string {
  const rate = formatSalesTaxRateLabel(rateBps);
  return rate ? `Tax (${rate})` : 'Tax';
}
