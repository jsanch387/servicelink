'use server';

/**
 * Server action: delete an add-on.
 * Resolves the current user and business, then deletes the add-on from the DB.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { deleteAddOn as deleteAddOnApi } from '../api/deleteAddOn';
import type { DeleteAddOnResult } from '../api/deleteAddOn';

export async function deleteAddOnAction(
  addonId: string
): Promise<DeleteAddOnResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to delete an add-on.',
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

  return deleteAddOnApi(supabase, addonId, businessProfile.id);
}
