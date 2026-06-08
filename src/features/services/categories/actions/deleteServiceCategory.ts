'use server';

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { DeleteServiceCategoryResult } from '../api/deleteServiceCategory';
import { deleteServiceCategory as deleteServiceCategoryApi } from '../api/deleteServiceCategory';

export async function deleteServiceCategoryAction(
  categoryId: string
): Promise<DeleteServiceCategoryResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to delete a category.',
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

  return deleteServiceCategoryApi(supabase, categoryId, businessProfile.id);
}
