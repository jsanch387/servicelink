'use server';

/**
 * Server action: update a service's is_active (visibility) flag.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { updateServiceIsActive as updateServiceIsActiveApi } from '../api/updateServiceIsActive';
import type { UpdateServiceIsActiveResult } from '../types/services';

export async function updateServiceIsActiveAction(
  serviceId: string,
  isActive: boolean
): Promise<UpdateServiceIsActiveResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to update a service.',
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

  return updateServiceIsActiveApi(
    supabase,
    serviceId,
    businessProfile.id,
    isActive
  );
}
