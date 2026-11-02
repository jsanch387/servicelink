import { ROUTES } from '@/constants/routes';
import { isInternalAnalyticsEmail } from '@/features/marketing-attribution/config/internalAnalyticsAllowlist';
import { PaidConversionReport } from '@/features/marketing-attribution/components/PaidConversionReport';
import { loadPaidConversionReport } from '@/features/marketing-attribution/server/loadPaidConversionReport';
import { parsePaidConversionPeriod } from '@/features/marketing-attribution/utils/paidConversion';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ad conversions',
  robots: { index: false, follow: false },
};

export default async function InternalAcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  if (!isInternalAnalyticsEmail(user.email)) {
    notFound();
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const params = await searchParams;
  const period = parsePaidConversionPeriod(params.period);
  const report = await loadPaidConversionReport(period);

  return (
    <PaidConversionReport
      report={report}
      pathname={ROUTES.DASHBOARD.INTERNAL_ACQUISITION}
    />
  );
}
