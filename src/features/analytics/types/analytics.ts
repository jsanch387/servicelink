/**
 * Analytics Types
 *
 * Type definitions for the analytics feature.
 * Covers profile view tracking and analytics data structures.
 */

import type { AnalyticsPeriod } from '@/features/analytics/constants';

export interface LinkViewsSummary {
  businessProfileId: string;
  period: AnalyticsPeriod;
  views: number;
  lastViewedAt: string | null;
}

/** @deprecated Use LinkViewsSummary — kept for gradual migration */
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
    /** True when a new page_view row was inserted (not a same-day dedup hit). */
    recorded: boolean;
    businessProfileId: string;
    /** Present when recorded and legacy counters were updated. */
    profileViews?: number;
    lastViewedAt?: string;
  };
  error?: string;
}

export interface LinkViewsSummaryResponse {
  success: boolean;
  data?: LinkViewsSummary;
  error?: string;
}

export interface AnalyticsApiResponse {
  success: boolean;
  data?: ProfileViewAnalytics;
  error?: string;
}

export interface DashboardAnalytics {
  views: number;
  period: AnalyticsPeriod;
  periodLabel: string;
  lastViewedAt: string | null;
  lastViewedFormatted: string;
}
