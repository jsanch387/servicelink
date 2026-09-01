import { API_ROUTES } from '@/constants/routes';

/** Both jobs share this slot so Vercel fires them together. */
export const CRON_DAILY_14_UTC = '0 14 * * *';

/**
 * Catalog of scheduled jobs. Keep `path` + `schedule` in sync with
 * `vercel.json` → `crons` (the file Vercel actually reads).
 *
 * Job *work* stays in the owning feature. This list is the index.
 */
export const CRON_JOBS = [
  {
    id: 'booking-reminders',
    path: API_ROUTES.INTERNAL_CRON_BOOKING_REMINDERS,
    schedule: CRON_DAILY_14_UTC,
    maxDurationSeconds: 300,
    work: 'src/features/availability/booking/server/reminders',
    description:
      'Tomorrow’s confirmed bookings: owner push, plus customer email/SMS when we have contact info.',
  },
  {
    id: 'quote-request-follow-ups',
    path: API_ROUTES.INTERNAL_CRON_QUOTE_REQUEST_FOLLOW_UPS,
    schedule: CRON_DAILY_14_UTC,
    maxDurationSeconds: 60,
    work: 'src/features/quotes/server/reminders',
    description:
      'Unanswered quote requests 1–4 days old: one owner push per day for 3 days.',
  },
] as const;

export type CronJob = (typeof CRON_JOBS)[number];
export type CronJobId = CronJob['id'];
