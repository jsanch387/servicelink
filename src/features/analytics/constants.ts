/** Ignore repeat page_view from the same visitor within this window (refresh spam). */
export const PAGE_VIEW_DEDUP_WINDOW_MS = 5 * 60 * 1000;

export const DEFAULT_ANALYTICS_PERIOD = '24h' as const;

export type AnalyticsPeriod = '24h' | '7d' | '30d' | 'all';

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
};

export function isAnalyticsPeriod(value: string): value is AnalyticsPeriod {
  return (
    value === '24h' || value === '7d' || value === '30d' || value === 'all'
  );
}

/** Periods exposed on the dashboard link-views card toggle */
export const DASHBOARD_LINK_VIEWS_PERIODS = ['24h', '7d', '30d'] as const;

export type DashboardLinkViewsPeriod =
  (typeof DASHBOARD_LINK_VIEWS_PERIODS)[number];

/** Only period available on the free plan */
export const FREE_TIER_ANALYTICS_PERIOD: DashboardLinkViewsPeriod = '24h';

export const PRO_ONLY_LINK_VIEWS_PERIODS: readonly DashboardLinkViewsPeriod[] =
  ['7d', '30d'];

export function isProOnlyLinkViewsPeriod(
  period: DashboardLinkViewsPeriod
): boolean {
  return (PRO_ONLY_LINK_VIEWS_PERIODS as readonly string[]).includes(period);
}

export function resolveLinkViewsPeriodForAccess(
  period: AnalyticsPeriod,
  hasProAccess: boolean
): AnalyticsPeriod {
  if (!isAnalyticsPeriod(period)) return DEFAULT_ANALYTICS_PERIOD;
  if (hasProAccess) return period;
  if (period === '7d' || period === '30d' || period === 'all') {
    return FREE_TIER_ANALYTICS_PERIOD;
  }
  return period;
}

export const DASHBOARD_LINK_VIEWS_PERIOD_SHORT: Record<
  DashboardLinkViewsPeriod,
  string
> = {
  '24h': '24h',
  '7d': '7d',
  '30d': '30d',
};

export function periodToSinceIso(period: AnalyticsPeriod): string | null {
  const now = Date.now();
  switch (period) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
      return null;
  }
}
