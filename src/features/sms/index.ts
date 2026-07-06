/**
 * SMS feature – transactional SMS via Pingram.
 * Public surface for sending booking-related SMS. Server-only; do not import
 * from client components.
 */

export { sendSms } from './services/sendSms';
export type { SendSmsParams, SendSmsResult } from './services/sendSms';

export { sendAndRecordSms } from './services/sendAndRecordSms';
export type {
  SendAndRecordSmsParams,
  SendAndRecordSmsResult,
} from './services/sendAndRecordSms';

export {
  buildBookingConfirmedSms,
  buildBookingReminderSms,
  buildJobCompletedSms,
  buildJobCompletedInvoiceSms,
  buildJobStartedSms,
  buildOnMyWaySms,
  buildReviewRequestSms,
  buildWorkFinishedSms,
} from './messages/bookingSms';
export type { BookingSmsContext } from './messages/bookingSms';

export { toE164 } from './utils/toE164';

export { isSmsOutboundEnabled } from './config/isSmsOutboundEnabled';
export {
  pausedSmsChannelOutcome,
  SMS_OUTBOUND_PAUSED_DOC,
} from './config/smsOutboundPaused';
