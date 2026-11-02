import type { SupabaseClient } from '@supabase/supabase-js';

import { quoteSalesTax } from '../shared/quoteSalesTax';

export type QuoteTaxPreview = {
  salesTaxEnabled: boolean;
  salesTaxRateBps: number;
};

/** Current shop rate for the quote builder. Saving still recomputes tax. */
export async function loadQuoteTaxPreview(
  supabase: SupabaseClient,
  businessId: string
): Promise<QuoteTaxPreview> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('payment_settings')
    .select('tax_enabled, tax_rate_bps')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('quote sales tax settings:', error);
    return { salesTaxEnabled: false, salesTaxRateBps: 0 };
  }

  return {
    salesTaxEnabled: data?.tax_enabled === true,
    salesTaxRateBps:
      typeof data?.tax_rate_bps === 'number' ? data.tax_rate_bps : 0,
  };
}

/**
 * Tax for a quote the owner is saving. Recomputed from payment settings so the
 * client cannot send its own tax amount.
 */
export async function loadQuoteSalesTax(
  supabase: SupabaseClient,
  businessId: string,
  priceCents: number
) {
  const preview = await loadQuoteTaxPreview(supabase, businessId);
  return quoteSalesTax({
    priceCents,
    taxEnabled: preview.salesTaxEnabled,
    taxRateBps: preview.salesTaxRateBps,
  });
}
