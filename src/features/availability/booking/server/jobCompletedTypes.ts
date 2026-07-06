/**
 * Types for the `job_completed` booking action (Complete sheet / Phase 1).
 * Wire contract: docs/contracts/mobile-booking-actions.md (extended body).
 */

export const JOB_COMPLETED_ACTION = 'job_completed';

export const SESSION_PAYMENT_METHODS = [
  'cash',
  'payment_app',
  'other',
  'tap_to_pay',
] as const;

export type SessionPaymentMethod = (typeof SESSION_PAYMENT_METHODS)[number];

export interface JobCompletedSessionFeeInput {
  label: string;
  amountCents: number;
}

export interface JobCompletedSessionPaymentInput {
  method: SessionPaymentMethod;
  amountCents: number;
  stripePaymentIntentId?: string;
}

export interface JobCompletedRequestBody {
  action: typeof JOB_COMPLETED_ACTION;
  sessionFees?: JobCompletedSessionFeeInput[];
  sessionPayment?: JobCompletedSessionPaymentInput;
}

export interface JobCompletedSuccessResponse {
  success: true;
  action: typeof JOB_COMPLETED_ACTION;
  jobStatus: 'completed';
  bookingStatus: 'completed';
  workHandoffStatus: 'notified' | 'skipped';
  invoicePublicToken: string | null;
  sms: {
    sent: boolean;
    messageId: string | null;
    reason: string | null;
  };
  email: {
    sent: boolean;
    messageId: string | null;
    reason: string | null;
  };
}
