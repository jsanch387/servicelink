/**
 * Customer nudge for an unanswered sent quote: email and SMS together.
 * SMS always includes the same `/q/` URL as the email.
 */

import { sendQuoteCustomerReminderEmail } from '@/features/email';
import { buildQuoteReminderSms, sendAndRecordSms } from '@/features/sms';
import type { SupabaseClient } from '@supabase/supabase-js';
import { claimQuoteCustomerReminder } from './claimQuoteCustomerReminder';
import { QUOTE_CUSTOMER_REMINDER_SMS_TYPE } from './constants';
import { findCustomerIdForQuoteContact } from './findCustomerIdForQuoteContact';
import { recordQuoteOutboundEvent } from './recordQuoteOutboundEvent';
import {
  quoteCustomerReminderLead,
  quoteCustomerReminderSmsDedupeKey,
} from '@/features/quotes/shared/quoteCustomerReminderCopy';

export type QuoteCustomerReminderNotifyResult = {
  claimed: boolean;
  email: 'sent' | 'skipped' | 'failed';
  sms: 'sent' | 'skipped' | 'failed';
};

const SMS_SKIP_REASONS = new Set([
  'duplicate',
  'no_phone',
  'sms_opt_out',
  'carrier_opt_out',
  'not_eligible',
  'not_configured',
]);

export async function notifyCustomerForQuoteReminder(
  admin: SupabaseClient,
  params: {
    quoteId: string;
    businessId: string;
    businessName: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    serviceName: string;
    publicQuoteUrl: string;
    expiresAt?: string | null;
    now?: Date;
  }
): Promise<QuoteCustomerReminderNotifyResult> {
  const publicQuoteUrl = params.publicQuoteUrl.trim();
  const email = params.customerEmail?.trim() || '';
  const phone = params.customerPhone?.trim() || '';

  if (!publicQuoteUrl || (!email && !phone)) {
    return { claimed: false, email: 'skipped', sms: 'skipped' };
  }

  const claimed = await claimQuoteCustomerReminder(
    admin,
    params.quoteId,
    params.now
  );
  if (!claimed) {
    return { claimed: false, email: 'skipped', sms: 'skipped' };
  }

  const customerId = phone
    ? await findCustomerIdForQuoteContact(admin, params.businessId, {
        email,
        phone,
      })
    : null;

  const sendEmail = async (): Promise<
    QuoteCustomerReminderNotifyResult['email']
  > => {
    if (!email) return 'skipped';
    try {
      const mail = await sendQuoteCustomerReminderEmail(email, {
        customerName: params.customerName,
        businessName: params.businessName,
        serviceName: params.serviceName,
        publicQuoteUrl,
        expiresAt: params.expiresAt,
      });
      if (!mail.sent) {
        console.warn('[quote-customer-reminder] email failed', {
          quoteId: params.quoteId,
          error: mail.error,
        });
        return 'failed';
      }
      await recordQuoteOutboundEvent(admin, {
        quoteId: params.quoteId,
        businessId: params.businessId,
        channel: 'email',
        type: 'quote_reminder',
        status: 'sent',
        toAddress: email,
      });
      return 'sent';
    } catch (e) {
      console.warn('[quote-customer-reminder] email error', {
        quoteId: params.quoteId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      });
      return 'failed';
    }
  };

  const sendSms = async (): Promise<
    QuoteCustomerReminderNotifyResult['sms']
  > => {
    if (!phone) return 'skipped';

    const sms = await sendAndRecordSms({
      admin,
      businessId: params.businessId,
      quoteId: params.quoteId,
      customerId,
      type: QUOTE_CUSTOMER_REMINDER_SMS_TYPE,
      to: phone,
      message: buildQuoteReminderSms({
        lead: quoteCustomerReminderLead(
          params.customerName,
          params.businessName
        ),
        publicQuoteUrl,
      }),
      dedupeKey: quoteCustomerReminderSmsDedupeKey(params.quoteId),
    });
    if (sms.sent) {
      await recordQuoteOutboundEvent(admin, {
        quoteId: params.quoteId,
        businessId: params.businessId,
        channel: 'sms',
        type: 'quote_reminder',
        status: 'sent',
        toAddress: phone,
        smsMessageId: sms.messageId,
      });
      return 'sent';
    }
    if (SMS_SKIP_REASONS.has(sms.reason)) return 'skipped';
    return 'failed';
  };

  const [emailResult, smsResult] = await Promise.all([sendEmail(), sendSms()]);
  return { claimed: true, email: emailResult, sms: smsResult };
}
