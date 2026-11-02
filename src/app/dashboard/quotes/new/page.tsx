import { ROUTES } from '@/constants/routes';
import { CreateQuoteScreen } from '@/features/quotes';
import { loadQuoteTaxPreview } from '@/features/quotes/server/loadQuoteSalesTax';
import { loadQuoteSendPaymentOffer } from '@/features/quotes/server/quotePaymentSnapshot';
import { loadQuoteServiceCatalog } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { getServiceCategories } from '@/features/services/categories/api/getServiceCategories';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewQuotePage() {
  const { supabase, context } = await requireCompletedShopPage('quotes.write');

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, business_slug, business_type')
    .eq('id', context.businessId)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const business = businessRow as {
    id: string;
    business_slug: string | null;
    business_type?: string | null;
  };

  const [serviceCatalog, categoriesResult, paymentOffer, salesTax] =
    await Promise.all([
      loadQuoteServiceCatalog(supabase, business.id),
      getServiceCategories(business.id),
      loadQuoteSendPaymentOffer(createSupabaseAdminClient(), business.id),
      loadQuoteTaxPreview(createSupabaseAdminClient(), business.id),
    ]);

  return (
    <CreateQuoteScreen
      businessSlug={business.business_slug}
      businessType={business.business_type}
      serviceCatalog={serviceCatalog}
      serviceCategories={categoriesResult.data ?? []}
      paymentOffer={paymentOffer}
      salesTaxEnabled={salesTax.salesTaxEnabled}
      salesTaxRateBps={salesTax.salesTaxRateBps}
    />
  );
}
