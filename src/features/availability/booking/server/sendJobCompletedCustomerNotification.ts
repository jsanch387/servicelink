/**
 * Customer notification after job_completed persistence — SMS-first, email
 * fallback, never both. Failures do not roll back the DB commit.
 */

import {
  mapJobCompletedEmailFailureReason,
  sendJobCompletedInvoiceEmail,
} from '@/features/email/job-completed/sendJobCompletedInvoiceEmail';
import { pausedSmsChannelOutcome } from '@/features/sms/config/smsOutboundPaused';
import type { NotifyChannelOutcome } from '@/features/reviews/server/createReviewInviteIfEligible';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPublicInvoiceUrl } from './buildInvoiceSnapshot';

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
    sms = pausedSmsChannelOutcome();
  } else {
    sms = { sent: false, messageId: null, reason: 'no_phone' };
  }

  // SMS_OUTBOUND_PAUSED — docs/sms-outbound-paused.md (job_completed invoice)
  /*
  if (phone) {
    const smsResult = await sendAndRecordSms({ ... });
    if (smsResult.sent) {
      return {
        sms: { sent: true, messageId: smsResult.messageId, reason: null },
        email,
      };
    }
    sms = { sent: false, messageId: null, reason: smsResult.reason };
  } else {
    sms = { sent: false, messageId: null, reason: 'no_phone' };
  }
  */

  const recipient = input.customerEmail?.trim() || '';
  if (recipient) {
    const emailResult = await sendJobCompletedInvoiceEmail(recipient, {
      businessName,
      customerName: input.customerName,
      invoiceUrl,
      includeReviewHint: input.includeReviewHint,
    });

    if (emailResult.sent) {
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
  } else {
    email = { sent: false, messageId: null, reason: 'no_email' };
  }

  return { sms, email };
}
