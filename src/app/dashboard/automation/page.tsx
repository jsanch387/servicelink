import { ROUTES } from '@/constants/routes';
import { AutomationPage } from '@/features/automation';
import {
  AUTOMATION_CONNECT_ERROR_FALLBACK,
  AUTOMATION_CONNECT_SUCCESS,
} from '@/features/automation/automationCopy';
import {
  instagramMessagingChannelsOf,
  mapChannelRowToPublic,
} from '@/features/automation/server/instagramMessagingChannelsQuery';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string; message?: string }>;
}) {
  const params = await searchParams;
  const connectFlag = params?.connect;
  const connectMessage = params?.message?.trim();

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

  const businessProfile = stateResult.data?.businessProfile;
  const businessId = businessProfile?.id;
  if (!businessId) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const [{ data: channelRow }, slugResult] = await Promise.all([
    instagramMessagingChannelsOf(supabase)
      .select(
        'instagram_account_id, facebook_page_id, facebook_page_name, instagram_username, connected_at'
      )
      .eq('business_id', businessId)
      .is('disconnected_at', null)
      .maybeSingle(),
    supabase
      .from('business_profiles')
      .select('business_slug, business_link')
      .eq('id', businessId)
      .single(),
  ]);

  const slugRow = slugResult.data as {
    business_slug: string | null;
    business_link: string | null;
  } | null;

  const hasBookingLink = Boolean(
    slugRow?.business_slug?.trim() && slugRow?.business_link?.trim()
  );

  const channel = channelRow ? mapChannelRowToPublic(channelRow) : null;

  let connectBanner: { kind: 'success' | 'error'; message: string } | null =
    null;

  if (connectFlag === 'return') {
    connectBanner = {
      kind: 'success',
      message: AUTOMATION_CONNECT_SUCCESS,
    };
  } else if (connectFlag === 'error') {
    connectBanner = {
      kind: 'error',
      message: connectMessage || AUTOMATION_CONNECT_ERROR_FALLBACK,
    };
  }

  if (connectFlag === 'return' || connectFlag === 'error') {
    return (
      <AutomationPage
        channel={channel}
        hasBookingLink={hasBookingLink}
        connectBanner={connectBanner}
      />
    );
  }

  return <AutomationPage channel={channel} hasBookingLink={hasBookingLink} />;
}
