import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { can, type TeamPermission } from '../constants/teamPermissions';
import type { DashboardAccessContext } from '../types/dashboardAccess';
import { resolveDashboardContext } from './resolveDashboardContext';

export type RequireDashboardPermissionResult =
  | { ok: true; context: DashboardAccessContext }
  | { ok: false; error: string; status: number };

export async function requireDashboardPermission(
  supabase: SupabaseClient<Database>,
  permission: TeamPermission
): Promise<RequireDashboardPermissionResult> {
  const resolved = await resolveDashboardContext(supabase);
  if (!resolved.ok) {
    return resolved;
  }

  if (!can(resolved.context, permission)) {
    return { ok: false, error: 'Forbidden', status: 403 };
  }

  return { ok: true, context: resolved.context };
}
