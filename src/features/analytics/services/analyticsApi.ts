/**
 * Analytics API Service
 *
 * Handles all analytics-related API calls.
 * Clean, modular API operations for analytics feature.
 */

import { createClient } from '@/libs/supabase';
import { AnalyticsApiResponse, ProfileViewAnalytics } from '../types/analytics';

export class AnalyticsApi {
  /**
   * Gets analytics data for a business profile
   */
  static async getProfileAnalytics(
    businessProfileId: string
  ): Promise<AnalyticsApiResponse> {
    try {
      const supabase = createClient();

      const { data: profile, error } = await supabase
        .from('business_profiles')
        .select('profile_views, last_viewed_at, id')
        .eq('id', businessProfileId)
        .single();

      if (error || !profile) {
        console.error('Error fetching analytics:', error);
        return {
          success: false,
          error: error?.message || 'Failed to fetch analytics data',
        };
      }

      const analytics: ProfileViewAnalytics = {
        profileViews: profile.profile_views || 0,
        lastViewedAt: profile.last_viewed_at,
        businessProfileId: profile.id,
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error in getProfileAnalytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets analytics data by business slug (for public profiles)
   */
  static async getAnalyticsBySlug(
    businessSlug: string
  ): Promise<AnalyticsApiResponse> {
    try {
      const supabase = createClient();

      const { data: profile, error } = await supabase
        .from('business_profiles')
        .select('profile_views, last_viewed_at, id')
        .eq('business_slug', businessSlug)
        .single();

      if (error || !profile) {
        console.error('Error fetching analytics by slug:', error);
        return {
          success: false,
          error: error?.message || 'Failed to fetch analytics data',
        };
      }

      const analytics: ProfileViewAnalytics = {
        profileViews: profile.profile_views || 0,
        lastViewedAt: profile.last_viewed_at,
        businessProfileId: profile.id,
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error in getAnalyticsBySlug:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
