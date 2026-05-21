/**
 * Analytics Hook
 *
 * Dashboard link view stats from public_analytics_events (default: last 24h).
 */

'use client';

import {
  ANALYTICS_PERIOD_LABELS,
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriod,
  type DashboardLinkViewsPeriod,
} from '@/features/analytics/constants';
import { useCallback, useEffect, useState } from 'react';
import { AnalyticsApi } from '../services/analyticsApi';
import type { DashboardAnalytics, LinkViewsSummary } from '../types/analytics';
import { formatLastVisit } from '../utils/formatLastVisit';

export const useAnalytics = (
  businessProfileId?: string,
  period: AnalyticsPeriod | DashboardLinkViewsPeriod = DEFAULT_ANALYTICS_PERIOD
) => {
  const [summary, setSummary] = useState<LinkViewsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!businessProfileId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await AnalyticsApi.getLinkViewsSummary(
        businessProfileId,
        period
      );

      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [businessProfileId, period]);

  const dashboardAnalytics: DashboardAnalytics | null = summary
    ? {
        views: summary.views,
        period: summary.period,
        periodLabel: ANALYTICS_PERIOD_LABELS[summary.period],
        lastViewedAt: summary.lastViewedAt,
        lastViewedFormatted: formatLastVisit(summary.lastViewedAt),
      }
    : null;

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    summary,
    dashboardAnalytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
