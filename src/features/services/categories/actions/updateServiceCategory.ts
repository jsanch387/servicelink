'use server';

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type {
  UpdateServiceCategoryPayload,
  UpdateServiceCategoryResult,
} from '../api/updateServiceCategory';
import { updateServiceCategory as updateServiceCategoryApi } from '../api/updateServiceCategory';

export async function updateServiceCategoryAction(
  categoryId: string,
  payload: UpdateServiceCategoryPayload
): Promise<UpdateServiceCategoryResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      data: null,
      error: 'You must be signed in to update a category.',
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

  return updateServiceCategoryApi(
    supabase,
    categoryId,
    businessProfile.id,
    payload
  );
}
