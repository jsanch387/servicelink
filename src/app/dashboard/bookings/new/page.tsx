import { ROUTES } from '@/constants/routes';
import { CreateAppointmentWizard } from '@/features/availability/booking/create-appointment';
import { buildPublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { loadQuoteServiceCatalog } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { getServiceCategories } from '@/features/services/categories/api/getServiceCategories';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewAppointmentPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select(
      'id, business_name, business_slug, service_location_mode, service_area, business_zip, shop_street_address, shop_unit'
    )
    .eq('profile_id', user.id)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const business = businessRow as {
    id: string;
    business_name: string;
    business_slug: string | null;
    service_location_mode?: string | null;
    service_area?: string | null;
    business_zip?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
  };

  const slug = business.business_slug?.trim() ?? '';
  if (!slug) {
    redirect(ROUTES.DASHBOARD.BOOKINGS);
  }

  const [serviceCatalog, categoriesResult] = await Promise.all([
    loadQuoteServiceCatalog(supabase, business.id),
    getServiceCategories(business.id),
  ]);

  const serviceLocation = buildPublicBookingServiceLocation(business);

  return (
    <CreateAppointmentWizard
      businessId={business.id}
      businessSlug={slug}
      businessName={business.business_name}
      serviceCatalog={serviceCatalog}
      serviceCategories={categoriesResult.data ?? []}
      serviceLocation={serviceLocation}
    />
  );
}
