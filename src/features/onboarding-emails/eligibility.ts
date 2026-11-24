import {
  A1_DELAY_MS,
  A2_AFTER_FIRST_MS,
  QR_CODE_DELAY_MS,
  QR_CODE_KEY,
  RECEIPT_REVIEW_AFTER_ASK_MS,
  RECEIPT_REVIEW_KEY,
  TEST_APPOINTMENT_DELAY_MS,
  TEST_APPOINTMENT_KEY,
  type SetupEmailKey,
} from './constants';

export interface SetupEmailState {
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  signupAt: Date;
  firstSentAt: Date | null;
  finalSentAt: Date | null;
  /** Chicago calendar day of the first email, when it has been sent. */
  firstSentOn: string | null;
  /** Chicago calendar day for `now`. */
  today: string;
  excluded: boolean;
  noEmail: boolean;
}

/**
 * The one email this run should send, if any.
 * A finished owner gets nothing. The last note is three days after the first
 * one was sent, and never on the same Chicago day.
 */
export function decideSetupEmail(
  state: SetupEmailState,
  now: Date
): SetupEmailKey | null {
  if (
    state.onboardingStatus === 'completed' ||
    state.excluded ||
    state.noEmail ||
    state.finalSentAt
  ) {
    return null;
  }

  const sinceSignup = now.getTime() - state.signupAt.getTime();
  if (!state.firstSentAt) {
    return sinceSignup >= A1_DELAY_MS ? 'A1_setup_one_step' : null;
  }

  const sinceFirst = now.getTime() - state.firstSentAt.getTime();
  const sameDay =
    state.firstSentOn != null && state.firstSentOn === state.today;
  if (sinceFirst >= A2_AFTER_FIRST_MS && !sameDay) return 'A2_setup_final';
  return null;
}

export interface TestAppointmentState {
  completedAt: Date | null;
  alreadySent: boolean;
  hasBooking: boolean;
}

/** The next-morning note. Nothing if they already booked, or the note already went out. */
export function decideTestAppointmentEmail(
  state: TestAppointmentState,
  now: Date
): typeof TEST_APPOINTMENT_KEY | null {
  if (state.alreadySent || state.hasBooking || !state.completedAt) return null;
  const elapsed = now.getTime() - state.completedAt.getTime();
  if (elapsed < TEST_APPOINTMENT_DELAY_MS) return null;
  return TEST_APPOINTMENT_KEY;
}

export interface ReceiptReviewState {
  /** When the first-appointment email was sent. */
  askSentAt: Date | null;
  /** Chicago calendar day of that email. */
  askSentOn: string | null;
  today: string;
  alreadySent: boolean;
  hasBooking: boolean;
}

/**
 * The last booking note. Only after the first-appointment email went out,
 * three days later, and only while the calendar is still empty.
 */
export function decideReceiptReviewEmail(
  state: ReceiptReviewState,
  now: Date
): typeof RECEIPT_REVIEW_KEY | null {
  if (state.alreadySent || state.hasBooking || !state.askSentAt) return null;
  if (state.askSentOn != null && state.askSentOn === state.today) return null;
  const elapsed = now.getTime() - state.askSentAt.getTime();
  if (elapsed < RECEIPT_REVIEW_AFTER_ASK_MS) return null;
  return RECEIPT_REVIEW_KEY;
}

export interface QrCodeState {
  firstBookingAt: Date | null;
  /** Chicago calendar day of that first booking. */
  firstBookingOn: string | null;
  today: string;
  alreadySent: boolean;
}

/**
 * The last note in the track. The morning after the first booking of any kind.
 * Nothing before that booking, and nothing again after this one goes out.
 */
export function decideQrCodeEmail(
  state: QrCodeState,
  now: Date
): typeof QR_CODE_KEY | null {
  if (state.alreadySent || !state.firstBookingAt) return null;
  if (state.firstBookingOn != null && state.firstBookingOn === state.today) {
    return null;
  }
  const elapsed = now.getTime() - state.firstBookingAt.getTime();
  if (elapsed < QR_CODE_DELAY_MS) return null;
  return QR_CODE_KEY;
}
