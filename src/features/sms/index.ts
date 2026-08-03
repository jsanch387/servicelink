/**
 * SMS feature – transactional customer SMS.
 * Public surface for sending booking-related SMS. Server-only; do not import
 * from client components. Provider wiring lives in `services/sendSms`.
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

export {
  isSmsOutboundEnabled,
  SMS_OUTBOUND_ENABLED,
} from './config/isSmsOutboundEnabled';
export {
  SMS_ROLLOUT_OWNER_EMAILS,
  isOwnerEmailAllowedForSmsRollout,
  isSmsRolloutAllowlistActive,
} from './config/smsRolloutAllowlist';
export {
  pausedSmsChannelOutcome,
  SMS_OUTBOUND_PAUSED_DOC,
} from './config/smsOutboundPaused';
