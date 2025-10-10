/**
 * Analytics Types
 *
 * Type definitions for the analytics feature.
 * Covers profile view tracking and analytics data structures.
 */

export interface ProfileViewAnalytics {
  profileViews: number;
  lastViewedAt: string | null;
  businessProfileId: string;
}

export interface TrackViewRequest {
  businessSlug: string;
  viewerIP?: string;
}

export interface TrackViewResponse {
  success: boolean;
  data?: {
    profileViews: number;
    lastViewedAt: string;
    businessProfileId: string;
  };
  error?: string;
}

export interface AnalyticsApiResponse {
  success: boolean;
  data?: ProfileViewAnalytics;
  error?: string;
}

// Analytics display data for dashboard
export interface DashboardAnalytics {
  profileViews: number;
  lastViewedAt: string | null;
  lastViewedFormatted: string;
}
