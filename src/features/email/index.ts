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
export { sendAvailabilityBookingCanceledEmail } from './availability-booking-canceled/sendAvailabilityBookingCanceledEmail';
export type {
  AvailabilityBookingCanceledPayload,
  SendAvailabilityBookingCanceledResult,
} from './availability-booking-canceled/types';
export type {
  AvailabilityBookingEmailJob,
  AvailabilityBookingNotificationPayload,
  AvailabilityBookingPaymentSummary,
  SendAvailabilityBookingNotificationResult,
} from './availability-booking-notification/types';

export { sendSubscriptionPaymentFailedEmail } from './subscription-payment-failed/sendSubscriptionPaymentFailedEmail';
export type { SendSubscriptionPaymentFailedResult } from './subscription-payment-failed/types';

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

export { sendMaintenanceEnrollmentConfirmedEmail } from './maintenance-enrollment-confirmed/sendMaintenanceEnrollmentConfirmedEmail';
export { sendMembershipManageLinkEmail } from './membership-manage-link/sendMembershipManageLinkEmail';
export type {
  MembershipManageLinkPayload,
  SendMembershipManageLinkResult,
} from './membership-manage-link/types';
export { sendMembershipSubscribeConfirmedEmail } from './membership-subscribe-confirmed/sendMembershipSubscribeConfirmedEmail';
export { sendMembershipCanceledEmail } from './membership-canceled/sendMembershipCanceledEmail';
export type {
  MembershipCanceledEmailKind,
  MembershipCanceledEmailPayload,
  SendMembershipCanceledEmailResult,
} from './membership-canceled/types';
export { sendMembershipVisitReminderEmail } from './membership-visit-reminder/sendMembershipVisitReminderEmail';
export type {
  MembershipVisitReminderPayload,
  SendMembershipVisitReminderResult,
} from './membership-visit-reminder/types';
export { sendMembershipInvoicePaidEmail } from './membership-invoice/sendMembershipInvoicePaidEmail';
export { sendMembershipInvoicePaymentFailedEmail } from './membership-invoice/sendMembershipInvoicePaymentFailedEmail';
export type {
  MembershipInvoiceEmailPayload,
  SendMembershipInvoiceEmailResult,
} from './membership-invoice/types';
export type {
  MaintenanceEnrollmentConfirmedPayload,
  SendMaintenanceEnrollmentConfirmedResult,
} from './maintenance-enrollment-confirmed/types';

export { sendWelcomeLiveEmail } from './welcome-live/sendWelcomeLiveEmail';
export type {
  SendWelcomeLiveEmailResult,
  WelcomeLiveEmailPayload,
} from './welcome-live/types';

export { sendReviewInviteEmail } from './review-invite/sendReviewInviteEmail';
export type {
  ReviewInviteEmailPayload,
  SendReviewInviteEmailResult,
} from './review-invite/types';

export { sendContactFormSubmissionEmail } from './contact-form-submission/sendContactFormSubmissionEmail';
export type {
  ContactFormSubmissionPayload,
  SendContactFormSubmissionResult,
} from './contact-form-submission/types';

export { sendProWelcomeEmail } from './pro-welcome/sendProWelcomeEmail';
export type {
  ProWelcomeEmailPayload,
  SendProWelcomeEmailResult,
} from './pro-welcome/types';
