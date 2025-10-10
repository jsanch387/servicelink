/**
 * View Tracking Service
 *
 * Handles profile view tracking with deduplication.
 * Ensures same IP doesn't count multiple views within 24 hours.
 */

interface ViewTrackingCache {
  [key: string]: number;
}

class ViewTrackingService {
  private viewCache: ViewTrackingCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Track a profile view with deduplication
   */
  async trackView(
    businessSlug: string,
    viewerIP?: string
  ): Promise<{
    success: boolean;
    newView?: boolean;
    totalViews?: number;
    error?: string;
  }> {
    try {
      // Create cache key for deduplication
      const cacheKey = this.createCacheKey(businessSlug, viewerIP);

      // Check if already viewed recently
      if (this.hasViewedRecently(cacheKey)) {
        console.log(
          `[Analytics] View already tracked recently for ${businessSlug}`
        );
        return { success: true, newView: false };
      }

      // Call API to track view
      const response = await fetch('/api/analytics/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessSlug,
          viewerIP,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('[Analytics] Failed to track view:', result.error);
        return { success: false, error: result.error };
      }

      // Cache the view to prevent duplicates
      this.cacheView(cacheKey);

      console.log(
        `[Analytics] View tracked successfully: ${businessSlug} - ${result.data.profileViews} total views`
      );

      return {
        success: true,
        newView: true,
        totalViews: result.data.profileViews,
      };
    } catch (error) {
      console.error('[Analytics] Error tracking view:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create cache key for deduplication
   */
  private createCacheKey(businessSlug: string, viewerIP?: string): string {
    const ip = viewerIP || this.getClientIP();
    return `${businessSlug}:${ip}`;
  }

  /**
   * Get client IP (fallback for browser)
   */
  private getClientIP(): string {
    // This is a fallback - in production, IP should come from server
    return 'browser-fallback';
  }

  /**
   * Check if view was tracked recently
   */
  private hasViewedRecently(cacheKey: string): boolean {
    const lastViewTime = this.viewCache[cacheKey];
    if (!lastViewTime) return false;

    const now = Date.now();
    const timeDiff = now - lastViewTime;

    return timeDiff < this.CACHE_DURATION;
  }

  /**
   * Cache a view to prevent duplicates
   */
  private cacheView(cacheKey: string): void {
    this.viewCache[cacheKey] = Date.now();

    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.viewCache).forEach(key => {
      if (now - this.viewCache[key] > this.CACHE_DURATION) {
        delete this.viewCache[key];
      }
    });
  }
}

export const viewTrackingService = new ViewTrackingService();
