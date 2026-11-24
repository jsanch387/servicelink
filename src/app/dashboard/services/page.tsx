/**
 * Services Dashboard Page
 *
 * Fetches services from the database and renders the services management UI.
 * Auth and onboarding are required; loading and errors are handled in the feature.
 */

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import {
  getAddOnCounts,
  getAddOns,
  getServiceCategories,
  getServices,
  ServicesWithAddOnsView,
} from '@/features/services';
import { sortServicesForDisplay } from '@/features/services/categories/utils/sortServicesForDisplay';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const { context } = await requireCompletedShopPage('services.write');

  const [servicesResult, categoriesResult] = await Promise.all([
    getServices(context.businessId),
    getServiceCategories(context.businessId),
  ]);
  const services = sortServicesForDisplay(
    servicesResult.data ?? [],
    categoriesResult.data ?? []
  );
  const categories = categoriesResult.data ?? [];

  const hasProAccess = await ownerHasProAccessForBusiness(
    createSupabaseAdminClient(),
    context.businessId
  );

  const [addOnsResult, addOnCounts] = await Promise.all([
    getAddOns(context.businessId),
    getAddOnCounts(
      context.businessId,
      services.map(s => s.id)
    ),
  ]);

  return (
    <ServicesWithAddOnsView
      initialServices={services}
      initialCategories={categories}
      fetchError={servicesResult.success ? null : servicesResult.error}
      categoriesFetchError={
        categoriesResult.success ? null : categoriesResult.error
      }
      addOnCounts={addOnCounts}
      initialAddOns={addOnsResult.data ?? []}
      addOnsFetchError={addOnsResult.success ? null : addOnsResult.error}
      hasProAccess={hasProAccess}
    />
  );
}
