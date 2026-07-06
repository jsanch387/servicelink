/**
 * Structured logs for the mobile `job_completed` action.
 * Grep server output for `[job_completed]` — rejections and finished outcomes only.
 */

import { shortEntityIdForLog } from '@/features/reviews/server/reviewInviteRouteLog';

const ROUTE_PREFIX = '[job_completed]';

export type JobCompletedLogStage =
  | 'received'
  | 'validated'
  | 'rejected'
  | 'amount_due'
  | 'persist_start'
  | 'persist_fees'
  | 'persist_payments'
  | 'persist_booking'
  | 'persist_invoice'
  | 'persist_duplicate'
  | 'review_invite'
  | 'maintenance'
  | 'notify_sms'
  | 'notify_email'
  | 'finished';

export interface JobCompletedLogTrace {
  requestId: string;
  bookingId: string;
  businessId?: string;
}

export function buildJobCompletedTrace(args: {
  requestId: string;
  bookingId: string;
  businessId?: string;
}): JobCompletedLogTrace {
  return {
    requestId: args.requestId,
    bookingId: args.bookingId.trim(),
    businessId: args.businessId?.trim(),
  };
}

function requestIdForLogLine(requestId: string): string {
  return requestId.length > 72 ? `${requestId.slice(0, 72)}…` : requestId;
}

function baseContext(trace: JobCompletedLogTrace): Record<string, string> {
  const ctx: Record<string, string> = {
    req: requestIdForLogLine(trace.requestId),
    booking: shortEntityIdForLog(trace.bookingId),
  };
  if (trace.businessId) {
    ctx.biz = shortEntityIdForLog(trace.businessId);
  }
  return ctx;
}

/** Log rejections and persist failures only — skip happy-path noise. */
export function logJobCompletedStage(
  trace: JobCompletedLogTrace,
  stage: JobCompletedLogStage,
  extra?: Record<string, unknown>
): void {
  if (stage !== 'rejected') {
    return;
  }

  const reason = String(extra?.reason ?? extra?.error ?? 'unknown');
  const ctx = baseContext(trace);
  const httpStatus =
    typeof extra?.httpStatus === 'number' ? extra.httpStatus : undefined;

  console.warn(
    `${ROUTE_PREFIX} rejected req=${ctx.req} booking=${ctx.booking}${
      ctx.biz ? ` biz=${ctx.biz}` : ''
    } status=${httpStatus ?? '?'} reason=${reason}`
  );
}

export function logJobCompletedFinished(
  trace: JobCompletedLogTrace,
  outcome: {
    duplicate?: boolean;
    invoicePublicToken: string | null;
    smsSent: boolean;
    smsReason?: string | null;
    emailSent: boolean;
    emailReason?: string | null;
    workHandoffStatus?: string;
  }
): void {
  const ctx = baseContext(trace);
  const detail = [
    outcome.duplicate ? 'duplicate' : 'success',
    outcome.workHandoffStatus ? `handoff=${outcome.workHandoffStatus}` : null,
    outcome.smsSent ? 'sms=sent' : `sms=${outcome.smsReason ?? 'skipped'}`,
    outcome.emailSent
      ? 'email=sent'
      : `email=${outcome.emailReason ?? 'skipped'}`,
    outcome.invoicePublicToken ? 'invoice=yes' : 'invoice=no',
  ]
    .filter(Boolean)
    .join(' ');

  console.info(
    `${ROUTE_PREFIX} finished req=${ctx.req} booking=${ctx.booking} ${detail}`
  );
}

export function maskPhoneForLog(phone: string | null | undefined): string {
  const t = phone?.trim() || '';
  if (!t) return '[none]';
  if (t.length <= 4) return '****';
  return `***${t.slice(-4)}`;
}

export function maskEmailForLog(email: string | null | undefined): string {
  const t = email?.trim() || '';
  if (!t) return '[none]';
  const at = t.indexOf('@');
  if (at <= 1) return '***';
  return `${t.slice(0, 1)}***${t.slice(at)}`;
}
