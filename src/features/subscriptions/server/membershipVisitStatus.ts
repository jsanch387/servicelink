import type {
  OwnerSubscriberStatus,
  OwnerSubscriberVisitStatus,
} from '../types/ownerSubscriptionPlan';

const VISIT_ELIGIBLE_STATUSES = new Set<OwnerSubscriberStatus>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
]);

export function periodStartsMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  return Number.isFinite(ta) && Number.isFinite(tb) && ta === tb;
}

export function periodVisitIsOnFile(
  visitStatus: OwnerSubscriberVisitStatus
): boolean {
  return visitStatus === 'scheduled' || visitStatus === 'completed';
}

function normalizeBookingStatus(status: string | null | undefined): string {
  return (status ?? '').trim().toLowerCase();
}

export function resolveMembershipVisitStatus(args: {
  status: OwnerSubscriberStatus;
  currentPeriodStart: string | null | undefined;
  periodVisitBookingId: string | null | undefined;
  periodVisitPeriodStart: string | null | undefined;
  /** When known, completed visits are not treated as upcoming. */
  periodVisitBookingStatus?: string | null;
  /** Stripe still `active` until period end — do not nag for another visit. */
  cancelScheduled?: boolean;
  /** Catalog plan is gone — not a live membership. */
  planRemoved?: boolean;
}): OwnerSubscriberVisitStatus {
  const bookingId = args.periodVisitBookingId?.trim();
  const linkedThisPeriod = Boolean(
    bookingId &&
      periodStartsMatch(args.periodVisitPeriodStart, args.currentPeriodStart)
  );

  let onFile: OwnerSubscriberVisitStatus | null = null;
  if (linkedThisPeriod) {
    const bookingStatus = normalizeBookingStatus(args.periodVisitBookingStatus);
    if (bookingStatus === 'completed') onFile = 'completed';
    else if (bookingStatus !== 'cancelled' && bookingStatus !== 'canceled') {
      onFile = 'scheduled';
    }
  }

  if (onFile) return onFile;

  const eligible =
    VISIT_ELIGIBLE_STATUSES.has(args.status) &&
    !args.cancelScheduled &&
    !args.planRemoved;
  if (!eligible) return 'none';

  return 'needs_visit';
}

/** Next-period schedule reminder — never on cancel / already-booked periods. */
export function shouldSendMembershipPeriodVisitReminder(args: {
  visitStatus: OwnerSubscriberVisitStatus;
  status: OwnerSubscriberStatus;
  cancelScheduled: boolean;
  periodStart: string | null | undefined;
  alreadyRemindedForPeriod: boolean;
}): boolean {
  if (args.status === 'canceled') return false;
  if (args.cancelScheduled) return false;
  if (args.visitStatus !== 'needs_visit') return false;
  if (!args.periodStart?.trim()) return false;
  if (args.alreadyRemindedForPeriod) return false;
  return true;
}
