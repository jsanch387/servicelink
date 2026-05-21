/**
 * Analytics API Service
 *
 * Handles all analytics-related API calls.
 */

import {
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriod,
} from '@/features/analytics/constants';
import type {
  LinkViewsSummary,
  LinkViewsSummaryResponse,
} from '../types/analytics';

export class AnalyticsApi {
  /**
   * Link view counts for the dashboard (from public_analytics_events).
   */
  static async getLinkViewsSummary(
    businessProfileId: string,
    period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD
  ): Promise<LinkViewsSummaryResponse> {
    try {
      const params = new URLSearchParams({
        businessProfileId,
        period,
      });
      const response = await fetch(`/api/analytics/summary?${params}`);
      const result = (await response.json()) as LinkViewsSummaryResponse;

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch link analytics',
        };
      }

      return result;
    } catch (error) {
      console.error('Error in getLinkViewsSummary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export type { LinkViewsSummary };
