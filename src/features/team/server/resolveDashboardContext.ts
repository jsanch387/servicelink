import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  permissionsForRole,
  type DashboardAccessRole,
} from '../constants/teamPermissions';
import type { ResolveDashboardContextResult } from '../types/dashboardAccess';
import { lookupActiveMembership } from './lookupActiveMembership';
import { lookupOwnedBusinessId } from './lookupOwnedBusinessId';

function assignedMemberRole(role: string): Exclude<DashboardAccessRole, 'owner'> {
  return role === 'manager' ? 'manager' : 'member';
}

/**
 * Shop the signed-in user can open: owned shop first, then an active
 * membership. Owners never need `business_members`.
 */
export async function resolveDashboardContext(
  supabase: SupabaseClient<Database>
): Promise<ResolveDashboardContextResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Authentication required', status: 401 };
  }

  const ownedBusinessId = await lookupOwnedBusinessId(supabase, user.id);
  if (ownedBusinessId) {
    return {
      ok: true,
      context: {
        userId: user.id,
        businessId: ownedBusinessId,
        isOwner: true,
        role: 'owner',
        permissions: permissionsForRole('owner'),
      },
    };
  }

  const membership = await lookupActiveMembership(supabase, user.id);
  if (membership) {
    const role = assignedMemberRole(membership.role);
    return {
      ok: true,
      context: {
        userId: user.id,
        businessId: membership.businessId,
        isOwner: false,
        role,
        permissions: permissionsForRole(role),
      },
    };
  }

  return { ok: false, error: 'Business profile not found', status: 404 };
}
