/**
 * Onboarding V2 – Step 1 server-side save.
 * Ensures business_profiles row exists, saves business_name + business_type,
 * and advances profiles.onboarding_step to 2.
 * Uses existing tables: profiles (onboarding_status, onboarding_step), business_profiles (business_name, business_type).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SaveStep1Params {
  profileId: string;
  businessProfileId?: string | null;
  businessName: string;
  businessType: string;
}

export interface SaveStep1Result {
  success: boolean;
  businessProfileId?: string;
  error?: string;
}

export async function saveStep1(
  supabase: SupabaseClient,
  params: SaveStep1Params
): Promise<SaveStep1Result> {
  const { profileId, businessProfileId, businessName, businessType } = params;

  try {
    let resolvedBusinessProfileId = businessProfileId ?? null;

    if (!resolvedBusinessProfileId) {
      // Create business profile (same as old onboarding startOnboarding)
      const publicId = `business_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const { data: inserted, error: insertError } = await supabase
        .from('business_profiles')
        .insert({
          profile_id: profileId,
          public_id: publicId,
          business_name: '',
          business_type: null,
        } as never)
        .select('id')
        .single();

      if (insertError || !inserted?.id) {
        return {
          success: false,
          error: insertError?.message ?? 'Failed to create business profile',
        };
      }
      resolvedBusinessProfileId = inserted.id;

      // Set user profile to step 1 in progress (so state is consistent)
      await supabase
        .from('profiles')
        .update({
          onboarding_step: 1,
          onboarding_status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profileId);
    }

    // Save step 1 data to business_profiles
    const { error: updateBusinessError } = await supabase
      .from('business_profiles')
      .update({
        business_name: businessName.trim(),
        business_type: businessType.trim() || null,
        updated_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      } as never)
      .eq('id', resolvedBusinessProfileId);

    if (updateBusinessError) {
      return {
        success: false,
        error: updateBusinessError.message,
      };
    }

    // Advance to step 2
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        onboarding_step: 2,
        onboarding_status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profileId);

    if (updateProfileError) {
      return {
        success: false,
        error: updateProfileError.message,
      };
    }

    return {
      success: true,
      businessProfileId: resolvedBusinessProfileId ?? undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save step 1',
    };
  }
}
