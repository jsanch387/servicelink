/** Step copy for the owner create-appointment wizard (UI only). */

export const CREATE_APPOINTMENT_CUSTOM_JOB_ID = '__custom_job__';

/**
 * Visit flow:
 * service → pricing → add-ons → customer → location → address → vehicle
 * (optional “add another job” loops) → schedule → review
 */
export const CREATE_APPOINTMENT_STEP_META = [
  {
    key: 'service',
    title: "What's the job?",
    subtitle: 'Your services, or a custom job.',
  },
  {
    key: 'pricing',
    title: 'Pricing',
    subtitle: '',
  },
  {
    key: 'addons',
    title: 'Add-ons',
    subtitle: '',
  },
  {
    key: 'customer',
    title: "Who's it for?",
    subtitle: 'Enter who this appointment is for.',
  },
  {
    key: 'location',
    title: 'Where will service happen?',
    subtitle: 'Mobile at the customer, or at your shop.',
  },
  {
    key: 'address',
    title: 'Service address',
    subtitle: 'Where should you meet them?',
  },
  {
    key: 'vehicle',
    title: 'Vehicle details',
    subtitle: 'Optional — add year, make, and model, or leave blank.',
  },
  {
    key: 'schedule',
    title: 'Date and time',
    subtitle: 'Choose the date and start time for this visit.',
  },
  {
    key: 'review',
    title: 'Review',
    subtitle: 'Please review the appointment details.',
  },
] as const;

export type CreateAppointmentStepKey =
  (typeof CREATE_APPOINTMENT_STEP_META)[number]['key'];

/** 0-based indices — keep in sync with {@link CREATE_APPOINTMENT_STEP_META} order. */
export const CREATE_APPOINTMENT_STEP = Object.freeze({
  SERVICE: 0,
  PRICING: 1,
  ADDONS: 2,
  CUSTOMER: 3,
  LOCATION: 4,
  ADDRESS: 5,
  VEHICLE: 6,
  SCHEDULE: 7,
  REVIEW: 8,
});

export const CREATE_APPOINTMENT_STEP_COUNT =
  CREATE_APPOINTMENT_STEP_META.length;

/** Max jobs in one manual visit (UI). Server allows more. */
export const CREATE_APPOINTMENT_MAX_JOBS = 4;

export const CREATE_APPOINTMENT_MAX_JOBS_MESSAGE =
  'You can add up to 4 jobs on one visit.';

export const CREATE_APPOINTMENT_KEEP_ONE_JOB_MESSAGE =
  'Keep at least one job on this visit.';
