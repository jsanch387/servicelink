import { ROUTES } from '@/constants/routes';
import { CreatePromoCodePage } from '@/features/marketing/components/CreatePromoCodePage';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditPromoCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromoCodePage({
  params,
}: EditPromoCodePageProps) {
  const { id } = await params;
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

  return <CreatePromoCodePage promoCodeId={id} />;
}
