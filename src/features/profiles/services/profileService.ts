/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Profile Service - AUTH ONLY
 *
 * Only creates profile during signup. Nothing else.
 */

import { stampV3ForNewProfile } from '@/features/onboarding-v3/server/stampV3ForNewProfile';
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
        onboarding_flow: 'v3',
        signup_platform: 'web',
      });

      if (error) {
        // The confirm-email trigger may have inserted the row first.
        if (error.code === '23505') {
          await stampV3ForNewProfile(supabase, userId);
          return { success: true };
        }
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
   * @param userId - The user ID to fetch profile for
   * @param columns - Optional: specific columns to select (defaults to '*')
   *                  Use this to optimize queries by only fetching needed columns
   */
  static async getProfile(userId: string, columns: string = '*') {
    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('profiles')
        .select(columns)
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
