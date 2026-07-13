/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Business Profile Service - Onboarding Only
 *
 * Handles business profile operations during onboarding flow.
 * Clean, simple CRUD operations for business_profiles table.
 */

import { ProfileService } from '@/features/profiles';
import { createClient } from '@/libs/supabase';

export class BusinessProfileService {
  /**
   * Starts onboarding process - creates business profile and updates user profile
   * Prevents duplicate creation if business profile already exists
   */
  static async startOnboarding(profileId: string) {
    try {
      const supabase = createClient();

      // First, check if business profile already exists
      const existingProfile =
        await this.getBusinessProfileByProfileId(profileId);
      if (existingProfile.success && existingProfile.data) {
        return { success: true, data: existingProfile.data };
      }

      // Generate unique public_id
      const publicId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create business profile
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .insert({
          profile_id: profileId,
          public_id: publicId,
          business_name: '', // Empty initially - user fills during onboarding
        } as any)
        .select()
        .single();

      if (businessError) {
        return { success: false, error: businessError.message };
      }

      // Update user profile to reflect onboarding start
      const profileUpdateResult = await ProfileService.updateProfile(
        profileId,
        {
          onboarding_step: 1,
          onboarding_status: 'in_progress',
        }
      );

      if (!profileUpdateResult.success) {
        // Don't fail the whole operation - business profile was created successfully
      }

      return { success: true, data: businessProfile };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to start onboarding',
      };
    }
  }

  /**
   * Updates business profile during onboarding steps
   * Called when user progresses through onboarding or skips steps
   */
  static async updateBusinessProfile(
    businessProfileId: string,
    updates: Record<string, unknown>
  ) {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('business_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_edited: new Date().toISOString(),
        } as never)
        .eq('id', businessProfileId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update business profile',
      };
    }
  }

  /**
   * Updates onboarding progress in user profile
   */
  static async updateOnboardingProgress(
    profileId: string,
    step: number,
    status: 'in_progress' | 'completed'
  ) {
    try {
      const result = await ProfileService.updateProfile(profileId, {
        onboarding_step: step,
        onboarding_status: status,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update progress',
      };
    }
  }

  /**
   * Gets business profile by profile_id (user's profile)
   * Used to check onboarding state and load existing data
   */
  static async getBusinessProfileByProfileId(profileId: string): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!rows?.[0]) {
        return { success: true, data: null as any };
      }

      return { success: true, data: rows[0] };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get business profile',
      };
    }
  }
}
