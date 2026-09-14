import { ROUTES } from '@/constants/routes';
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
