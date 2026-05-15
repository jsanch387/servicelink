'use server';

/**
 * Server action: create a new service.
 * Resolves the current user and business, then inserts the service in the DB.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { createService as createServiceApi } from '../api/createService';
import type {
  CreateServicePayload,
  CreateServiceResult,
} from '../types/services';

export async function createServiceAction(
  payload: CreateServicePayload
): Promise<CreateServiceResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      data: null,
      error: 'You must be signed in to add a service.',
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

  return createServiceApi(supabase, businessProfile.id, payload);
}
