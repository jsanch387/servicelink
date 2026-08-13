import type { OwnerSubscriberStatus } from '../types/ownerSubscriptionPlan';

export const OWNER_SUBSCRIBER_STATUS_STYLES: Record<
  OwnerSubscriberStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  },
  trialing: {
    label: 'Trial',
    className: 'border-sky-400/20 bg-sky-500/10 text-sky-300',
  },
  past_due: {
    label: 'Past due',
    className: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  },
  paused: {
    label: 'Paused',
    className: 'border-white/10 bg-white/[0.04] text-zinc-400',
  },
  canceled: {
    label: 'Canceled',
    className: 'border-white/10 bg-white/[0.04] text-zinc-500',
  },
  incomplete: {
    label: 'Incomplete',
    className: 'border-white/10 bg-white/[0.04] text-zinc-500',
  },
};

/** GlassCard blur tint by membership health (matches quotes/bookings). */
export function getSubscriberStatusBlurClass(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): string {
  if (cancelAtPeriodEnd && status !== 'canceled') return 'bg-amber-500';
  switch (status) {
    case 'active':
    case 'trialing':
      return 'bg-emerald-500';
    case 'past_due':
    case 'unpaid':
      return 'bg-amber-500';
    case 'canceled':
    case 'incomplete':
    case 'paused':
    default:
      return 'bg-zinc-500';
  }
}

export function getSubscriberStatusDotClass(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): string {
  if (cancelAtPeriodEnd && status !== 'canceled') return 'bg-amber-400';
  switch (status) {
    case 'active':
      return 'bg-emerald-400';
    case 'trialing':
      return 'bg-sky-400';
    case 'past_due':
    case 'unpaid':
      return 'bg-amber-400';
    default:
      return 'bg-zinc-500';
  }
}

/**
 * Scheduled cancel (still has access until period / cancel_at).
 * Shown as "Canceled" so owners don't miss it; banner explains access end date.
 */
export function isSubscriberCancelScheduled(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): boolean {
  return Boolean(cancelAtPeriodEnd) && status !== 'canceled';
}

export function getSubscriberStatusLabel(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): string {
  if (isSubscriberCancelScheduled(status, cancelAtPeriodEnd)) return 'Canceled';
  return OWNER_SUBSCRIBER_STATUS_STYLES[status].label;
}

/** Pill styles — scheduled cancel uses amber, not green Active. */
export function getSubscriberStatusClassName(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): string {
  if (isSubscriberCancelScheduled(status, cancelAtPeriodEnd)) {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
  }
  return OWNER_SUBSCRIBER_STATUS_STYLES[status].className;
}

export function formatSubscriberBillingDate(date: string | null): string {
  if (!date) return '—';
  try {
    const d = date.includes('T')
      ? new Date(date)
      : new Date(`${date}T12:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

/** Summary / table label for the billing date column. */
export function getSubscriberBillingDateLabel(
  status: OwnerSubscriberStatus,
  cancelAtPeriodEnd?: boolean
): string {
  if (status === 'canceled') return 'Next bill';
  if (isSubscriberCancelScheduled(status, cancelAtPeriodEnd)) {
    return 'Access until';
  }
  return 'Next bill';
}

/** Value for next-bill / access-until column (— when fully canceled). */
export function formatSubscriberBillingDateValue(args: {
  status: OwnerSubscriberStatus;
  cancelAtPeriodEnd?: boolean;
  nextBillingAt: string | null;
}): string {
  if (args.status === 'canceled') return '—';
  return formatSubscriberBillingDate(args.nextBillingAt);
}
