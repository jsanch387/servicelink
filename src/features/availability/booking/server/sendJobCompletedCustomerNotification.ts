/**
 * Customer notification after job_completed persistence — SMS-first, email
 * fallback, never both. Failures do not roll back the DB commit.
 */

import {
  mapJobCompletedEmailFailureReason,
  sendJobCompletedInvoiceEmail,
} from '@/features/email/job-completed/sendJobCompletedInvoiceEmail';
import type { NotifyChannelOutcome } from '@/features/reviews/server/createReviewInviteIfEligible';
import { buildJobCompletedInvoiceSms, sendAndRecordSms } from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPublicInvoiceUrl } from './buildInvoiceSnapshot';
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
  includeReviewHint: boolean;
  requestId?: string;
}

export interface JobCompletedNotificationResult {
  sms: NotifyChannelOutcome;
  email: NotifyChannelOutcome;
}

export async function sendJobCompletedCustomerNotification(
  input: JobCompletedNotificationInput
): Promise<JobCompletedNotificationResult> {
  const invoiceUrl = buildPublicInvoiceUrl(input.invoicePublicToken);
  const businessName = input.businessName.trim() || 'Your provider';
  const trace = buildJobCompletedTrace({
    requestId: input.requestId ?? input.bookingId,
    bookingId: input.bookingId,
    businessId: input.businessId,
  });

  let sms: NotifyChannelOutcome = {
    sent: false,
    messageId: null,
    reason: null,
  };
  let email: NotifyChannelOutcome = {
    sent: false,
    messageId: null,
    reason: null,
  };

  const phone = input.customerPhone?.trim() || '';

  if (phone) {
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
        businessName,
        invoiceUrl,
        includeReviewHint: input.includeReviewHint,
      }),
      dedupeKey: `${input.bookingId}:job_completed`,
      recipientId: `booking:${input.bookingId}`,
      correlationId: input.bookingId,
    });

    if (smsResult.sent) {
      logJobCompletedStage(trace, 'notify_sms', {
        invoiceUrl,
        sent: true,
        messageId: smsResult.messageId,
      });
      return {
        sms: { sent: true, messageId: smsResult.messageId, reason: null },
        email,
      };
    }
    sms = { sent: false, messageId: null, reason: smsResult.reason };
    logJobCompletedStage(trace, 'notify_sms', {
      invoiceUrl,
      sent: false,
      reason: smsResult.reason,
    });
  } else {
    sms = { sent: false, messageId: null, reason: 'no_phone' };
    logJobCompletedStage(trace, 'notify_sms', {
      invoiceUrl,
      skipped: true,
      reason: 'no_phone',
    });
  }

  const recipient = input.customerEmail?.trim() || '';
  if (recipient) {
    logJobCompletedStage(trace, 'notify_email', {
      invoiceUrl,
      toEmail: maskEmailForLog(recipient),
      includeReviewHint: input.includeReviewHint,
      smsFailedFirst: !sms.sent,
    });

    const emailResult = await sendJobCompletedInvoiceEmail(recipient, {
      businessName,
      customerName: input.customerName,
      invoiceUrl,
      includeReviewHint: input.includeReviewHint,
    });

    if (emailResult.sent) {
      logJobCompletedStage(trace, 'notify_email', {
        invoiceUrl,
        sent: true,
        messageId: emailResult.messageId,
      });
      return {
        sms,
        email: { sent: true, messageId: emailResult.messageId, reason: null },
      };
    }
    email = {
      sent: false,
      messageId: null,
      reason: mapJobCompletedEmailFailureReason(emailResult.error),
    };
    logJobCompletedStage(trace, 'notify_email', {
      invoiceUrl,
      sent: false,
      reason: email.reason,
    });
  } else {
    email = { sent: false, messageId: null, reason: 'no_email' };
    logJobCompletedStage(trace, 'notify_email', {
      invoiceUrl,
      skipped: true,
      reason: 'no_email',
    });
  }

  return { sms, email };
}
