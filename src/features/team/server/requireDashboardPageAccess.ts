import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

import type { TeamPermission } from '../constants/teamPermissions';
import { requireDashboardPermission } from './requireDashboardPermission';

export async function requireDashboardPageAccess(permission: TeamPermission) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const result = await requireDashboardPermission(supabase, permission);
  if (!result.ok) {
    if (result.status === 401) {
      redirect(ROUTES.AUTH.LOGIN);
    }
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  return { supabase, user, context: result.context };
}

/** Office page. Owners still have to finish setting up their own shop. */
export async function requireCompletedShopPage(permission: TeamPermission) {
  const access = await requireDashboardPageAccess(permission);
  if (access.context.isOwner) {
    const state = await getOnboardingState(access.user.id, access.supabase);
    if (!state.success || state.data?.status !== 'completed') {
      redirect(ROUTES.DASHBOARD.MAIN);
    }
  }
  return access;
}
