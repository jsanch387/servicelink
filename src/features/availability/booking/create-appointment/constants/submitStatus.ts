export const CREATE_APPOINTMENT_SUBMIT_MESSAGES = [
  'Submitting appointment',
  'Saving job details',
  'Checking your schedule',
  'Notifying the customer',
  'Wrapping up',
] as const;

/** How long each status line stays visible while confirming. */
export const CREATE_APPOINTMENT_SUBMIT_MESSAGE_MS = 2200;

/** Minimum time on the submitting screen before success/error (avoids a flash). */
export const CREATE_APPOINTMENT_SUBMIT_MIN_MS = 3200;
