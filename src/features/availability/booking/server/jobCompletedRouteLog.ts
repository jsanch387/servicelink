/**
 * Structured logs for the mobile `job_completed` action.
 * Grep server output for `[job_completed]` to trace a completion end-to-end.
 */

import { getPublicInvoicePath } from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import {
  maskEmailForLog,
  shortEntityIdForLog,
} from '@/features/reviews/server/reviewInviteRouteLog';

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

export function buildInvoiceUrlForLog(publicToken: string): string {
  const token = publicToken.trim();
  if (!token) return '';
  return `${getAppBaseUrl()}${getPublicInvoicePath(token)}`;
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

function formatLine(
  stage: JobCompletedLogStage,
  trace: JobCompletedLogTrace,
  detail?: string
): string {
  const parts = [stage, ...Object.entries(baseContext(trace)).map(([k, v]) => `${k}=${v}`)];
  if (detail?.trim()) parts.push(detail.trim());
  return `${ROUTE_PREFIX} ${parts.join(' ')}`;
}

/** Stage log — always includes copy-pasteable JSON when `extra` has an invoice URL. */
export function logJobCompletedStage(
  trace: JobCompletedLogTrace,
  stage: JobCompletedLogStage,
  extra?: Record<string, unknown>
): void {
  const invoiceUrl =
    typeof extra?.invoiceUrl === 'string'
      ? extra.invoiceUrl
      : typeof extra?.invoicePublicToken === 'string'
        ? buildInvoiceUrlForLog(extra.invoicePublicToken)
        : undefined;

  const payload = {
    ...baseContext(trace),
    stage,
    ...(invoiceUrl ? { invoiceUrl } : {}),
    ...extra,
  };

  if (stage === 'rejected') {
    console.warn(formatLine(stage, trace, String(extra?.reason ?? extra?.error ?? '')));
    console.warn(`${ROUTE_PREFIX}`, payload);
    return;
  }

  console.info(formatLine(stage, trace));
  console.info(`${ROUTE_PREFIX}`, payload);
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
  const invoiceUrl = outcome.invoicePublicToken
    ? buildInvoiceUrlForLog(outcome.invoicePublicToken)
    : null;

  const detail = [
    outcome.duplicate ? 'duplicate' : 'success',
    outcome.workHandoffStatus ? `handoff=${outcome.workHandoffStatus}` : null,
    outcome.smsSent ? 'sms=sent' : `sms=${outcome.smsReason ?? 'skipped'}`,
    outcome.emailSent ? 'email=sent' : `email=${outcome.emailReason ?? 'skipped'}`,
    invoiceUrl ? `invoice=${invoiceUrl}` : 'invoice=none',
  ]
    .filter(Boolean)
    .join(' ');

  console.info(formatLine('finished', trace, detail));
  console.info(`${ROUTE_PREFIX}`, {
    ...baseContext(trace),
    stage: 'finished',
    duplicate: Boolean(outcome.duplicate),
    invoicePublicToken: outcome.invoicePublicToken,
    invoiceUrl,
    sms: { sent: outcome.smsSent, reason: outcome.smsReason ?? null },
    email: { sent: outcome.emailSent, reason: outcome.emailReason ?? null },
    workHandoffStatus: outcome.workHandoffStatus ?? null,
  });

  if (invoiceUrl) {
    console.info(`${ROUTE_PREFIX} OPEN INVOICE → ${invoiceUrl}`);
  }
}

export function maskPhoneForLog(phone: string | null | undefined): string {
  const t = phone?.trim() || '';
  if (!t) return '[none]';
  if (t.length <= 4) return '****';
  return `***${t.slice(-4)}`;
}

export { maskEmailForLog };
