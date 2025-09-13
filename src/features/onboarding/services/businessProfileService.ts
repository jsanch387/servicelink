/**
 * Business Profile Service - Onboarding Only
 *
 * Handles business profile operations during onboarding flow.
 * Clean, simple CRUD operations for business_profiles table.
 */

import { createClient } from '@/libs/supabase';
import { ProfileService } from '@/features/profiles';

export class BusinessProfileService {
  /**
   * Starts onboarding process - creates business profile and updates user profile
   * Prevents duplicate creation if business profile already exists
   */
  static async startOnboarding(profileId: string) {
    console.log('🚀 Starting onboarding for profile:', profileId);

    try {
      const supabase = createClient() as any;

      // First, check if business profile already exists
      const existingProfile =
        await this.getBusinessProfileByProfileId(profileId);
      if (existingProfile.success && existingProfile.data) {
        console.log(
          '✅ Business profile already exists, returning existing:',
          existingProfile.data.id
        );
        return { success: true, data: existingProfile.data };
      }

      console.log('📝 Creating new business profile...');

      // Generate unique public_id
      const publicId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create business profile
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .insert({
          profile_id: profileId,
          public_id: publicId,
          business_name: '', // Empty initially - user fills during onboarding
        })
        .select()
        .single();

      if (businessError) {
        console.error('❌ Failed to create business profile:', businessError);
        return { success: false, error: businessError.message };
      }

      console.log('✅ Business profile created:', businessProfile.id);

      // Update user profile to reflect onboarding start
      console.log('📝 Updating user profile onboarding status...');
      const profileUpdateResult = await ProfileService.updateProfile(
        profileId,
        {
          onboarding_step: 1,
          onboarding_status: 'in_progress',
        }
      );

      if (!profileUpdateResult.success) {
        console.warn(
          '⚠️ Business profile created but failed to update user profile:',
          profileUpdateResult.error
        );
        // Don't fail the whole operation - business profile was created successfully
      } else {
        console.log('✅ User profile updated with onboarding status');
      }

      return { success: true, data: businessProfile };
    } catch (error) {
      console.error('❌ Onboarding start error:', error);
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
  static async updateBusinessProfile(businessProfileId: string, updates: any) {
    console.log('📝 Updating business profile:', businessProfileId, updates);

    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('business_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_edited: new Date().toISOString(),
        })
        .eq('id', businessProfileId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update business profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Business profile updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Business profile update error:', error);
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
    console.log(
      `📈 Updating onboarding progress: Step ${step}, Status: ${status}`
    );

    try {
      const result = await ProfileService.updateProfile(profileId, {
        onboarding_step: step,
        onboarding_status: status,
      });

      if (result.success) {
        console.log('✅ Onboarding progress updated');
      } else {
        console.error('❌ Failed to update onboarding progress:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Onboarding progress update error:', error);
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
  static async getBusinessProfileByProfileId(profileId: string) {
    console.log('🔍 Looking for business profile with profile_id:', profileId);

    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        // If no business profile exists, that's OK - user hasn't started onboarding
        if (error.code === 'PGRST116') {
          console.log(
            "ℹ️ No business profile found - user hasn't started onboarding"
          );
          return { success: true, data: null };
        }
        console.error('❌ Error fetching business profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Business profile found:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Business profile fetch error:', error);
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
