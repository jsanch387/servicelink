import { sanitizeBusinessSpecialties } from '@/constants/businessSpecialties';
import {
  canonicalizeBusinessType,
  isAllowedBusinessTypeValue,
} from '@/constants/businessTypes';
import { lookupActiveMemberBusinessId } from '@/features/team/server/lookupActiveMemberBusinessId';
import type { SupabaseClient } from '@supabase/supabase-js';

import { requireV3Flow } from './requireV3Flow';

export interface SaveIndustryParams {
  profileId: string;
  industry: string;
  trades: string[];
}

export interface SaveIndustryResult {
  success: boolean;
  businessProfileId?: string;
  error?: string;
  statusCode?: number;
}

export async function saveIndustry(
  supabase: SupabaseClient,
  params: SaveIndustryParams
): Promise<SaveIndustryResult> {
  const gate = await requireV3Flow(supabase, params.profileId);
  if (!gate.ok) {
    return { success: false, error: gate.error, statusCode: gate.statusCode };
  }
  if (gate.status === 'completed') {
    return {
      success: false,
      error: 'Setup is already finished',
      statusCode: 400,
    };
  }

  const memberBusinessId = await lookupActiveMemberBusinessId(
    supabase,
    params.profileId
  );
  if (memberBusinessId) {
    return {
      success: false,
      error: "You're on a team and can't create a shop.",
      statusCode: 400,
    };
  }

  const typeTrimmed = params.industry.trim();
  if (!typeTrimmed || !isAllowedBusinessTypeValue(typeTrimmed)) {
    return {
      success: false,
      error: 'Choose the kind of work you do',
      statusCode: 400,
    };
  }

  const specialties = sanitizeBusinessSpecialties(params.trades);
  if (specialties.length === 0) {
    return {
      success: false,
      error: 'Pick at least one trade',
      statusCode: 400,
    };
  }

  const typeToStore = canonicalizeBusinessType(typeTrimmed) ?? typeTrimmed;

  const { data: existingRows, error: existingError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', params.profileId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (existingError) {
    return { success: false, error: existingError.message, statusCode: 500 };
  }

  let businessProfileId = existingRows?.[0]?.id ?? null;

  if (!businessProfileId) {
    const publicId = `business_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const { data: inserted, error: insertError } = await supabase
      .from('business_profiles')
      .insert({
        profile_id: params.profileId,
        public_id: publicId,
        business_name: '',
        business_type: typeToStore,
        specialties,
      } as never)
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      return {
        success: false,
        error: insertError?.message ?? 'Failed to create business profile',
        statusCode: 500,
      };
    }
    businessProfileId = inserted.id;
  } else {
    const { error: updateError } = await supabase
      .from('business_profiles')
      .update({
        business_type: typeToStore,
        specialties,
        updated_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      } as never)
      .eq('id', businessProfileId);

    if (updateError) {
      return { success: false, error: updateError.message, statusCode: 500 };
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      onboarding_step: 2,
      onboarding_status: 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', params.profileId);

  if (profileError) {
    return { success: false, error: profileError.message, statusCode: 500 };
  }

  return { success: true, businessProfileId: businessProfileId ?? undefined };
}
