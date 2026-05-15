'use server';

/**
 * Server action: save the current services sort order.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { updateServicesOrder as updateServicesOrderApi } from '../api/updateServicesOrder';
import type { UpdateServicesOrderResult } from '../types/services';

export async function saveServicesOrderAction(
  orderedServiceIds: string[]
): Promise<UpdateServicesOrderResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to reorder services.',
    };
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || !stateResult.data) {
    return {
      success: false,
      error: 'Could not load your business.',
    };
  }

  const { status, businessProfile } = stateResult.data;
  if (status !== 'completed' || !businessProfile?.id) {
    return {
      success: false,
      error: 'Business profile is not set up.',
    };
  }

  return updateServicesOrderApi(
    supabase,
    businessProfile.id,
    orderedServiceIds
  );
}
