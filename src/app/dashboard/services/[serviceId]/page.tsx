/**
 * Service Edit Page
 *
 * Full-page edit for a single service: details + add-ons pool (display only for now).
 * Fetches service by ID and add-ons from DB, renders ServiceEditScreen.
 */

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import {
  getAddOns,
  getServiceAddOnIds,
  getServiceCategories,
  getServicePriceOptions,
  getServices,
  ServiceEditScreen,
} from '@/features/services';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ServiceEditPageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function ServiceEditPage({
  params,
}: ServiceEditPageProps) {
  const { serviceId } = await params;
  const { context } = await requireCompletedShopPage('services.write');

  const [
    servicesResult,
    addOnsResult,
    assignedResult,
    optionsResult,
    categoriesResult,
  ] = await Promise.all([
    getServices(context.businessId),
    getAddOns(context.businessId),
    getServiceAddOnIds(serviceId),
    getServicePriceOptions(serviceId, context.businessId),
    getServiceCategories(context.businessId),
  ]);

  const canUsePriceOptions = await ownerHasProAccessForBusiness(
    createSupabaseAdminClient(),
    context.businessId
  );

  if (!servicesResult.success || !servicesResult.data) {
    redirect('/dashboard/services');
  }

  const service = servicesResult.data.find(s => s.id === serviceId);
  if (!service) {
    notFound();
  }

  const addOns =
    addOnsResult.success && addOnsResult.data ? addOnsResult.data : [];
  const initialSelectedAddOnIds =
    assignedResult.success && assignedResult.data ? assignedResult.data : [];
  const initialPriceOptions =
    optionsResult.success && optionsResult.data ? optionsResult.data : [];
  const initialCategories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  return (
    <ServiceEditScreen
      service={service}
      initialCategories={initialCategories}
      initialAddOns={addOns}
      initialSelectedAddOnIds={initialSelectedAddOnIds}
      initialPriceOptions={initialPriceOptions}
      canUsePriceOptions={canUsePriceOptions}
      backHref="/dashboard/services"
    />
  );
}
