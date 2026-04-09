import type { DashboardQuoteStatus, QuotesDashboardFilterId } from '../types';

const OPEN_STATUSES: DashboardQuoteStatus[] = [
  'draft',
  'requested',
  'sent',
  'viewed',
];

const CLOSED_STATUSES: DashboardQuoteStatus[] = [
  'approved',
  'declined',
  'expired',
  'cancelled',
];

export function quoteMatchesFilter(
  status: DashboardQuoteStatus,
  filter: QuotesDashboardFilterId
): boolean {
  if (filter === 'all') return true;
  if (filter === 'open') return OPEN_STATUSES.includes(status);
  return CLOSED_STATUSES.includes(status);
}

export function getQuoteStatusLabel(status: DashboardQuoteStatus): string {
  const labels: Record<DashboardQuoteStatus, string> = {
    requested: 'Requested',
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    approved: 'Approved',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/** GlassCard `blurColor` tailwind bg token (matches booking row vibe). */
export function getQuoteStatusBlurClass(status: DashboardQuoteStatus): string {
  switch (status) {
    case 'draft':
    case 'requested':
      return 'bg-zinc-500';
    case 'sent':
      return 'bg-sky-500';
    case 'viewed':
      return 'bg-violet-500';
    case 'approved':
      return 'bg-emerald-500';
    case 'declined':
    case 'cancelled':
      return 'bg-rose-500';
    case 'expired':
      return 'bg-amber-500';
    default:
      return 'bg-zinc-500';
  }
}

/** Dot only for outcomes that benefit from a quick color cue (list + detail badges). */
export function getQuoteOutcomeDotClass(
  status: DashboardQuoteStatus
): string | null {
  if (status === 'approved') return 'bg-emerald-400';
  if (status === 'declined') return 'bg-rose-400';
  return null;
}

export function formatQuoteListMeta(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const day = 86400000;
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) {
      const m = Math.floor(diffMs / 60000);
      return `${m}m ago`;
    }
    if (diffMs < day) {
      const h = Math.floor(diffMs / 3600000);
      return `${h}h ago`;
    }
    if (diffMs < day * 7) {
      const days = Math.floor(diffMs / day);
      return `${days}d ago`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function formatQuoteCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
