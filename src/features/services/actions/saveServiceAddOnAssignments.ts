'use server';

/**
 * Server action: save add-on assignments for a service.
 * Replaces which add-ons are offered for that service.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { saveServiceAddOnAssignments as saveServiceAddOnAssignmentsApi } from '../api/saveServiceAddOnAssignments';
import type { SaveServiceAddOnAssignmentsResult } from '../api/saveServiceAddOnAssignments';

export async function saveServiceAddOnAssignmentsAction(
  serviceId: string,
  addonIds: string[]
): Promise<SaveServiceAddOnAssignmentsResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to save add-on selection.',
    };
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || !stateResult.data) {
    return {
      success: false,
      error: 'Could not load your business.',
    };
  }

  const { status } = stateResult.data;
  if (status !== 'completed') {
    return {
      success: false,
      error: 'Business profile is not set up.',
    };
  }

  return saveServiceAddOnAssignmentsApi(supabase, serviceId, addonIds);
}
