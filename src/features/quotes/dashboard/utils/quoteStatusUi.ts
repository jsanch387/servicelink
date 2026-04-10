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

/**
 * Short absolute date for quote list cards (stable; not tied to `updated_at`).
 */
export function formatQuoteListCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString(
      'en-US',
      sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' }
    );
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
