import { API_ROUTES } from '@/constants/routes';
import { CRON_DAILY_14_UTC, CRON_JOBS } from '@/features/cron/jobs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

type VercelCron = { path: string; schedule: string };

function loadVercelCrons(): VercelCron[] {
  const raw = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8');
  const parsed = JSON.parse(raw) as { crons?: VercelCron[] };
  return parsed.crons ?? [];
}

describe('CRON_JOBS catalog', () => {
  it('matches vercel.json crons (path + schedule)', () => {
    const vercel = loadVercelCrons();
    expect(vercel).toHaveLength(CRON_JOBS.length);

    for (const job of CRON_JOBS) {
      expect(vercel).toContainEqual({
        path: job.path,
        schedule: job.schedule,
      });
    }
  });

  it('uses the centralized booking-reminders route', () => {
    expect(CRON_JOBS[0]?.path).toBe(API_ROUTES.INTERNAL_CRON_BOOKING_REMINDERS);
  });

  it('registers quote-request follow-ups', () => {
    expect(CRON_JOBS.map(job => job.id)).toContain('quote-request-follow-ups');
    expect(
      CRON_JOBS.find(job => job.id === 'quote-request-follow-ups')?.path
    ).toBe(API_ROUTES.INTERNAL_CRON_QUOTE_REQUEST_FOLLOW_UPS);
  });

  it('runs both jobs on the same daily slot', () => {
    expect(new Set(CRON_JOBS.map(job => job.schedule))).toEqual(
      new Set([CRON_DAILY_14_UTC])
    );
  });
});
