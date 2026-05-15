'use server';

/**
 * Server action: update an add-on.
 * Resolves the current user and business, then updates the add-on in the DB.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { UpdateAddOnPayload, UpdateAddOnResult } from '../api/updateAddOn';
import { updateAddOn as updateAddOnApi } from '../api/updateAddOn';

export async function updateAddOnAction(
  addonId: string,
  payload: UpdateAddOnPayload
): Promise<UpdateAddOnResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      data: null,
      error: 'You must be signed in to update an add-on.',
    };
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || !stateResult.data) {
    return {
      success: false,
      data: null,
      error: 'Could not load your business.',
    };
  }

  const { status, businessProfile } = stateResult.data;
  if (status !== 'completed' || !businessProfile?.id) {
    return {
      success: false,
      data: null,
      error: 'Business profile is not set up.',
    };
  }

  return updateAddOnApi(supabase, addonId, businessProfile.id, payload);
}
