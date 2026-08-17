/**
 * Customer notification after job_completed persistence.
 * Sends receipt SMS and/or email based on available contact info
 * (both when both exist). Failures do not roll back the DB commit.
 */

import {
  mapJobCompletedEmailFailureReason,
  sendJobCompletedInvoiceEmail,
} from '@/features/email/job-completed/sendJobCompletedInvoiceEmail';
import type { JobCompletedInvoiceEmailJob } from '@/features/email/job-completed/jobCompletedInvoiceTemplate';
import { buildJobCompletedInvoiceSms, sendAndRecordSms } from '@/features/sms';
import type { NotifyChannelOutcome } from '@/features/reviews/server/createReviewInviteIfEligible';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCustomerInvoiceUrl } from './buildInvoiceSnapshot';
import {
  buildJobCompletedTrace,
  logJobCompletedStage,
  maskEmailForLog,
  maskPhoneForLog,
} from './jobCompletedRouteLog';

export interface JobCompletedNotificationInput {
  admin: SupabaseClient<Database>;
  businessId: string;
  bookingId: string;
  customerId: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerName: string;
  businessName: string;
  invoicePublicToken: string;
  /** Prefer for SMS/email customer links when present. */
  invoiceShortCode?: string | null;
  includeReviewHint: boolean;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  totalCents?: number;
  subtotalCents?: number;
  discount?: {
    label: string;
    discountCents: number;
  } | null;
  reviewUrl?: string | null;
  coveredByMembership?: boolean;
  jobs?: JobCompletedInvoiceEmailJob[];
  requestId?: string;
}

export interface JobCompletedNotificationResult {
  sms: NotifyChannelOutcome;
  email: NotifyChannelOutcome;
}

export async function sendJobCompletedCustomerNotification(
  input: JobCompletedNotificationInput
): Promise<JobCompletedNotificationResult> {
  const invoiceUrl = buildCustomerInvoiceUrl({
    publicToken: input.invoicePublicToken,
    shortCode: input.invoiceShortCode,
  });
  const businessName = input.businessName.trim() || 'Your provider';
  const trace = buildJobCompletedTrace({
    requestId: input.requestId ?? input.bookingId,
    bookingId: input.bookingId,
    businessId: input.businessId,
  });

  const phone = input.customerPhone?.trim() || '';
  const recipient = input.customerEmail?.trim() || '';

  const sendSms = async (): Promise<NotifyChannelOutcome> => {
    if (!phone) {
      logJobCompletedStage(trace, 'notify_sms', {
        invoiceUrl,
        skipped: true,
        reason: 'no_phone',
      });
      return { sent: false, messageId: null, reason: 'no_phone' };
    }

    logJobCompletedStage(trace, 'notify_sms', {
      invoiceUrl,
      invoicePublicToken: input.invoicePublicToken,
      toPhone: maskPhoneForLog(phone),
      includeReviewHint: input.includeReviewHint,
    });

    const smsResult = await sendAndRecordSms({
      admin: input.admin,
      businessId: input.businessId,
      bookingId: input.bookingId,
      customerId: input.customerId,
      type: 'job_completed',
      to: phone,
      message: buildJobCompletedInvoiceSms({
        invoiceUrl,
        includeReviewHint: input.includeReviewHint,
      }),
      dedupeKey: `${input.bookingId}:job_completed`,
      correlationId: input.bookingId,
    });

    if (smsResult.sent) {
      logJobCompletedStage(trace, 'notify_sms', {
        invoiceUrl,
        sent: true,
        messageId: smsResult.messageId,
      });
      return { sent: true, messageId: smsResult.messageId, reason: null };
    }

    logJobCompletedStage(trace, 'notify_sms', {
      invoiceUrl,
      sent: false,
      reason: smsResult.reason,
    });
    return { sent: false, messageId: null, reason: smsResult.reason };
  };

  const sendEmail = async (): Promise<NotifyChannelOutcome> => {
    if (!recipient) {
      return { sent: false, messageId: null, reason: 'no_email' };
    }

    logJobCompletedStage(trace, 'notify_email', {
      invoiceUrl,
      toEmail: maskEmailForLog(recipient),
      includeReviewHint: input.includeReviewHint,
    });

    const emailResult = await sendJobCompletedInvoiceEmail(recipient, {
      businessName,
      customerName: input.customerName,
      invoiceUrl,
      includeReviewHint: input.includeReviewHint,
      serviceName: input.serviceName,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      totalCents: input.totalCents,
      subtotalCents: input.subtotalCents,
      discount: input.discount,
      reviewUrl: input.reviewUrl,
      coveredByMembership: input.coveredByMembership === true,
      jobs: input.jobs,
    });

    if (emailResult.sent) {
      return {
        sent: true,
        messageId: emailResult.messageId,
        reason: null,
      };
    }

    return {
      sent: false,
      messageId: null,
      reason: mapJobCompletedEmailFailureReason(emailResult.error),
    };
  };

  const [sms, email] = await Promise.all([sendSms(), sendEmail()]);
  return { sms, email };
}
