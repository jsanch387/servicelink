import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { TeamPermission } from '../constants/teamPermissions';
import type { DashboardAccessContext } from '../types/dashboardAccess';
import { requireDashboardPermission } from './requireDashboardPermission';

export type RequireBusinessPermissionResult =
  | { ok: true; businessId: string; context: DashboardAccessContext }
  | { ok: false; error: string; status: number };

/** Resolve the current shop and require a permission on it. */
export async function requireBusinessPermission(
  supabase: SupabaseClient<Database>,
  permission: TeamPermission
): Promise<RequireBusinessPermissionResult> {
  const result = await requireDashboardPermission(supabase, permission);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    businessId: result.context.businessId,
    context: result.context,
  };
}
