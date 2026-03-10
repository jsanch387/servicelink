'use server';

/**
 * Server action: create a new add-on.
 * Resolves the current user and business, then inserts the add-on in the DB.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { CreateAddOnPayload, CreateAddOnResult } from '../api/createAddOn';
import { createAddOn as createAddOnApi } from '../api/createAddOn';

export async function createAddOnAction(
  payload: CreateAddOnPayload
): Promise<CreateAddOnResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      data: null,
      error: 'You must be signed in to add an add-on.',
    };
  }

  const stateResult = await getOnboardingState(user.id);
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

  return createAddOnApi(supabase, businessProfile.id, payload);
}
