import { API_ROUTES } from '@/constants/routes';

/**
 * Catalog of scheduled jobs. Keep `path` + `schedule` in sync with
 * `vercel.json` → `crons` (the file Vercel actually reads).
 */
export const CRON_JOBS = [
  {
    id: 'booking-reminders',
    path: API_ROUTES.INTERNAL_CRON_BOOKING_REMINDERS,
    schedule: '0 14 * * *',
    description:
      'One owner push + inbox row when they have confirmed bookings tomorrow.',
  },
] as const;

export type CronJob = (typeof CRON_JOBS)[number];
export type CronJobId = CronJob['id'];
