/**
 * Profile Service - AUTH ONLY
 *
 * Only creates profile during signup. Nothing else.
 */

import { createClient } from '@/libs/supabase';

export class ProfileService {
  /**
   * Creates a profile for a new user during signup
   * This is the ONLY function needed for auth flow
   */
  static async createProfile(userId: string, fullName?: string | null) {
    try {
      const supabase = createClient() as any;

      const { error } = await supabase.from('profiles').insert({
        user_id: userId,
        full_name: fullName,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create profile',
      };
    }
  }

  /**
   * Updates user profile (used for onboarding progress tracking)
   */
  static async updateProfile(userId: string, updates: any) {
    try {
      const supabase = createClient() as any;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  /**
   * Gets user profile by user_id
   */
  static async getProfile(userId: string) {
    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
      };
    }
  }
}
