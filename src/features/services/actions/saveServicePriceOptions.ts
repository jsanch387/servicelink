'use server';

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { saveServicePriceOptions as saveServicePriceOptionsApi } from '../api/saveServicePriceOptions';
import type {
  SaveServicePriceOptionsResult,
  ServicePriceOptionSaveInput,
} from '../types/services';
import { hasPriceOptionsAccess } from '../utils/priceOptionsAccess';

export async function saveServicePriceOptionsAction(
  serviceId: string,
  options: ServicePriceOptionSaveInput[]
): Promise<SaveServicePriceOptionsResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to update service price options.',
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

  const canUsePriceOptions = await hasPriceOptionsAccess({
    supabase,
    userId: user.id,
  });

  if (!canUsePriceOptions) {
    return {
      success: false,
      error:
        'Price options are a Pro feature. Upgrade to add multiple prices per service.',
    };
  }

  return saveServicePriceOptionsApi(
    supabase,
    serviceId,
    businessProfile.id,
    options
  );
}
