/**
 * Analytics Hook
 *
 * Custom hook for managing analytics data and view tracking.
 * Provides easy integration with React components.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnalyticsApi } from '../services/analyticsApi';
import { DashboardAnalytics, ProfileViewAnalytics } from '../types/analytics';

export const useAnalytics = (businessProfileId?: string) => {
  const [analytics, setAnalytics] = useState<ProfileViewAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    if (!businessProfileId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await AnalyticsApi.getProfileAnalytics(businessProfileId);

      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [businessProfileId]);

  /**
   * Format analytics for dashboard display
   */
  const getDashboardAnalytics = useCallback((): DashboardAnalytics | null => {
    if (!analytics) return null;

    const formatLastViewed = (lastViewed: string | null): string => {
      if (!lastViewed) return 'Never';

      const date = new Date(lastViewed);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    };

    return {
      profileViews: analytics.profileViews,
      lastViewedAt: analytics.lastViewedAt,
      lastViewedFormatted: formatLastViewed(analytics.lastViewedAt),
    };
  }, [analytics]);

  // Fetch analytics on mount and when businessProfileId changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    dashboardAnalytics: getDashboardAnalytics(),
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
