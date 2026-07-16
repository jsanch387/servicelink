import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { CreateQuoteScreen } from '@/features/quotes';
import { loadQuoteServiceCatalog } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { getServiceCategories } from '@/features/services/categories/api/getServiceCategories';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ quoteId: string }>;
}

export default async function DashboardQuoteEditPage({ params }: PageProps) {
  const { quoteId } = await params;
  if (!quoteId?.trim()) {
    redirect(ROUTES.DASHBOARD.QUOTES);
  }

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
    .select('id, business_slug')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const business = businessRow as {
    id: string;
    business_slug: string | null;
  };

  const [serviceCatalog, categoriesResult] = await Promise.all([
    loadQuoteServiceCatalog(supabase, business.id),
    getServiceCategories(business.id),
  ]);

  return (
    <CreateQuoteScreen
      businessSlug={business.business_slug}
      mode="edit"
      quoteId={quoteId.trim()}
      serviceCatalog={serviceCatalog}
      serviceCategories={categoriesResult.data ?? []}
    />
  );
}
