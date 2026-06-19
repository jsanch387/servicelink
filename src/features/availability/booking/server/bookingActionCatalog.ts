/**
 * Registry of owner-triggered booking actions.
 *
 * Each action bundles, in one place: the `job_status` it transitions the
 * booking to, which states that transition is valid from, and the customer SMS
 * to send. The `POST /api/availability/bookings/[id]/actions` endpoint is fully
 * data-driven from this map — adding a new action (e.g. a future "delayed"
 * notice) means adding one entry here, not a new route.
 *
 * SMS and state are decoupled: the state transition is the authoritative
 * outcome; the SMS is a best-effort notification sent after the transition.
 */

import { buildJobStartedSms, buildOnMyWaySms } from '@/features/sms';
import type { JobStatus } from '../jobStatus';

export type BookingActionType = 'on_the_way' | 'job_started' | 'job_completed';

interface BaseBookingActionConfig {
  type: BookingActionType;
  /** Job status this action moves the booking to. */
  jobStatus: JobStatus;
  /** Current job statuses this action is allowed from. */
  allowedFromJobStatus: JobStatus[];
  /** Human label for error messages, e.g. "on the way". */
  label: string;
}

/**
 * Notify-only action: the route sends a single best-effort customer SMS after
 * the `job_status` transition.
 */
export interface NotifyBookingActionConfig extends BaseBookingActionConfig {
  completesBooking?: false;
  /** `sms_messages.type` value for the logged message. */
  smsType: string;
  /** Builds the customer SMS body. */
  buildMessage: (ctx: { businessName: string }) => string;
  /** When true, dedupe SMS with key `"<bookingId>:<smsType>"`. */
  oncePerBooking: boolean;
}

/**
 * Completing action: besides the `job_status` move, it completes the booking
 * lifecycle (`bookings.status = 'completed'`) and runs the shared completion
 * side effects. The customer notification (review-link SMS first, email
 * fallback, or a plain thank-you SMS) is owned by `completeBookingWithSideEffects`,
 * so there are no `smsType`/`buildMessage` fields here.
 */
export interface CompletingBookingActionConfig extends BaseBookingActionConfig {
  completesBooking: true;
}

export type BookingActionConfig =
  | NotifyBookingActionConfig
  | CompletingBookingActionConfig;

export const BOOKING_ACTIONS: Record<BookingActionType, BookingActionConfig> = {
  on_the_way: {
    type: 'on_the_way',
    smsType: 'on_the_way',
    buildMessage: buildOnMyWaySms,
    oncePerBooking: true,
    jobStatus: 'on_the_way',
    allowedFromJobStatus: ['not_started'],
    label: 'on the way',
  },
  job_started: {
    type: 'job_started',
    smsType: 'job_started',
    buildMessage: buildJobStartedSms,
    oncePerBooking: true,
    jobStatus: 'in_progress',
    allowedFromJobStatus: ['not_started', 'on_the_way'],
    label: 'started',
  },
  job_completed: {
    type: 'job_completed',
    jobStatus: 'completed',
    allowedFromJobStatus: ['not_started', 'on_the_way', 'in_progress'],
    label: 'completed',
    completesBooking: true,
  },
};

export const BOOKING_ACTION_TYPES = Object.keys(
  BOOKING_ACTIONS
) as BookingActionType[];

/** Handoff action handled outside the job_status registry (see handleWorkFinishedAction). */
export const BOOKING_HANDOFF_ACTION_TYPES = ['work_finished'] as const;

export const ALL_BOOKING_ACTION_TYPES = [
  ...BOOKING_ACTION_TYPES,
  ...BOOKING_HANDOFF_ACTION_TYPES,
] as const;

export function getBookingAction(
  action: string | null | undefined
): BookingActionConfig | null {
  if (!action) return null;
  return (
    (BOOKING_ACTIONS as Record<string, BookingActionConfig>)[action.trim()] ??
    null
  );
}
