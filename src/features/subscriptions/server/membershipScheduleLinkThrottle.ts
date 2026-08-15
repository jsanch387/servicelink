import { periodStartsMatch } from './membershipVisitStatus';

/** Wait between sends to the same subscriber. */
export const MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS = 10 * 60 * 1000;
/** Extra sends this period if the customer missed the first one. */
export const MEMBERSHIP_SCHEDULE_LINK_MAX_PER_PERIOD = 3;

export type MembershipScheduleLinkThrottleResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; reason: 'cooldown' | 'period_cap' };

function asMetaRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export function evaluateMembershipScheduleLinkThrottle(args: {
  nowMs?: number;
  currentPeriodStart: string | null | undefined;
  metadata: unknown;
}): MembershipScheduleLinkThrottleResult {
  const meta = asMetaRecord(args.metadata);
  const now = args.nowMs ?? Date.now();
  const periodStart = args.currentPeriodStart?.trim() || null;
  const sentFor =
    typeof meta.schedule_link_sent_for_period_start === 'string'
      ? meta.schedule_link_sent_for_period_start
      : null;
  const samePeriod = Boolean(
    periodStart && periodStartsMatch(sentFor, periodStart)
  );
  const count =
    samePeriod && typeof meta.schedule_link_send_count === 'number'
      ? meta.schedule_link_send_count
      : 0;

  if (samePeriod && count >= MEMBERSHIP_SCHEDULE_LINK_MAX_PER_PERIOD) {
    return { ok: false, retryAfterSec: 60 * 60, reason: 'period_cap' };
  }

  const sentAtRaw =
    typeof meta.schedule_link_sent_at === 'string'
      ? Date.parse(meta.schedule_link_sent_at)
      : NaN;
  if (Number.isFinite(sentAtRaw)) {
    const waitMs = MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS - (now - sentAtRaw);
    if (waitMs > 0) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)),
        reason: 'cooldown',
      };
    }
  }

  return { ok: true };
}

export function stampMembershipScheduleLinkMetadata(
  metadata: unknown,
  currentPeriodStart: string,
  nowIso: string
): Record<string, unknown> {
  const meta = asMetaRecord(metadata);
  const samePeriod = periodStartsMatch(
    typeof meta.schedule_link_sent_for_period_start === 'string'
      ? meta.schedule_link_sent_for_period_start
      : null,
    currentPeriodStart
  );
  const prev =
    samePeriod && typeof meta.schedule_link_send_count === 'number'
      ? meta.schedule_link_send_count
      : 0;

  return {
    ...meta,
    schedule_link_sent_at: nowIso,
    schedule_link_sent_for_period_start: currentPeriodStart,
    schedule_link_send_count: prev + 1,
  };
}

export function membershipScheduleLinkThrottleMessage(
  reason: 'cooldown' | 'period_cap'
): string {
  if (reason === 'period_cap') {
    return 'This subscriber already got a schedule link a few times this period.';
  }
  return 'Already sent. Try again in a few minutes.';
}
