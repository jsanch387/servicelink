/**
 * Email feature – transactional emails via Resend.
 * Add new email types as subfolders (e.g. booking-notification) and re-export here.
 */

export { sendBookingNotificationEmail } from './booking-notification/sendBookingNotificationEmail';
export type {
  BookingNotificationPayload,
  SendBookingNotificationResult,
} from './booking-notification/types';

export { sendAvailabilityBookingCustomerConfirmationEmail } from './availability-booking-notification/sendAvailabilityBookingCustomerConfirmationEmail';
export { sendAvailabilityBookingNotificationEmail } from './availability-booking-notification/sendAvailabilityBookingNotificationEmail';
export type {
  AvailabilityBookingNotificationPayload,
  AvailabilityBookingPaymentSummary,
  SendAvailabilityBookingNotificationResult,
} from './availability-booking-notification/types';

export { sendSubscriptionPaymentFailedEmail } from './subscription-payment-failed/sendSubscriptionPaymentFailedEmail';
export type { SendSubscriptionPaymentFailedResult } from './subscription-payment-failed/types';
export { sendTrialEndingSoonEmail } from './trial-ending-soon/sendTrialEndingSoonEmail';
export type {
  SendTrialEndingSoonEmailParams,
  SendTrialEndingSoonEmailResult,
} from './trial-ending-soon/types';

export { sendQuoteSentToCustomerEmail } from './quote-sent-to-customer/sendQuoteSentToCustomerEmail';
export type {
  QuoteSentToCustomerPayload,
  SendQuoteSentToCustomerResult,
} from './quote-sent-to-customer/types';

export { sendQuoteRequestOwnerNotificationEmail } from './quote-request-owner-notification/sendQuoteRequestOwnerNotificationEmail';
export type {
  QuoteRequestOwnerNotificationPayload,
  SendQuoteRequestOwnerNotificationResult,
} from './quote-request-owner-notification/types';
