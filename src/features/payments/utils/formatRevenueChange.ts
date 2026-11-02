import type { PaymentsRevenuePeriod } from '../revenue/constants';

export type RevenueChangeTone = 'up' | 'down' | 'neutral';

export function revenueVersusLabel(period: PaymentsRevenuePeriod): string {
  if (period === 'week') return 'last week';
  if (period === 'month') return 'last month';
  if (period === 'year') return 'last year';
  if (period === 'all') return '';
  return 'prior period';
}

export function revenueChangeTone(
  changePercent: number | null | undefined
): RevenueChangeTone {
  if (changePercent == null || changePercent === 0) return 'neutral';
  return changePercent > 0 ? 'up' : 'down';
}

export function formatRevenueChangeLabel(
  changePercent: number | null | undefined,
  versus: string
): string {
  if (!versus.trim()) return '';
  if (changePercent == null) return `vs ${versus}`;
  if (changePercent === 0) return `Flat vs ${versus}`;
  const up = changePercent > 0;
  return `${up ? '↑' : '↓'} ${Math.abs(changePercent)}% vs ${versus}`;
}
