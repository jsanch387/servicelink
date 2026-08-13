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

export function resolveMembershipVisitStatus(args: {
  status: OwnerSubscriberStatus;
  currentPeriodStart: string | null | undefined;
  periodVisitBookingId: string | null | undefined;
  periodVisitPeriodStart: string | null | undefined;
}): OwnerSubscriberVisitStatus {
  if (!VISIT_ELIGIBLE_STATUSES.has(args.status)) return 'none';

  const bookingId = args.periodVisitBookingId?.trim();
  if (
    bookingId &&
    periodStartsMatch(args.periodVisitPeriodStart, args.currentPeriodStart)
  ) {
    return 'scheduled';
  }

  return 'needs_visit';
}
