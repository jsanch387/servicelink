'use server';

/**
 * Server action: update a service.
 * Resolves the current user and business, then updates the service in the DB.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { updateService as updateServiceApi } from '../api/updateService';
import type {
  UpdateServicePayload,
  UpdateServiceResult,
} from '../types/services';
import { hasPriceOptionsAccess } from '../utils/priceOptionsAccess';

export async function updateServiceAction(
  serviceId: string,
  payload: UpdateServicePayload
): Promise<UpdateServiceResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      data: null,
      error: 'You must be signed in to update a service.',
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

  const canUsePriceOptions = await hasPriceOptionsAccess({
    supabase,
    userId: user.id,
  });

  const normalizedPayload: UpdateServicePayload = {
    ...payload,
    ...(payload.price_options_enabled != null && !canUsePriceOptions
      ? { price_options_enabled: false }
      : {}),
  };

  return updateServiceApi(
    supabase,
    serviceId,
    businessProfile.id,
    normalizedPayload
  );
}
