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
    expect(CRON_JOBS.find(job => job.id === 'booking-reminders')?.path).toBe(
      API_ROUTES.INTERNAL_CRON_BOOKING_REMINDERS
    );
  });

  it('expires unanswered appointment requests each day', () => {
    expect(CRON_JOBS.map(job => job.id)).toContain(
      'appointment-request-expirations'
    );
    expect(
      CRON_JOBS.find(job => job.id === 'appointment-request-expirations')?.path
    ).toBe(API_ROUTES.INTERNAL_CRON_APPOINTMENT_REQUEST_EXPIRATIONS);
  });

  it('registers quote-request follow-ups', () => {
    expect(CRON_JOBS.map(job => job.id)).toContain('quote-request-follow-ups');
    expect(
      CRON_JOBS.find(job => job.id === 'quote-request-follow-ups')?.path
    ).toBe(API_ROUTES.INTERNAL_CRON_QUOTE_REQUEST_FOLLOW_UPS);
  });

  it('registers quote customer reminders', () => {
    expect(CRON_JOBS.map(job => job.id)).toContain('quote-customer-reminders');
    expect(
      CRON_JOBS.find(job => job.id === 'quote-customer-reminders')?.path
    ).toBe(API_ROUTES.INTERNAL_CRON_QUOTE_CUSTOMER_REMINDERS);
  });

  it('registers google review pulls', () => {
    expect(CRON_JOBS.map(job => job.id)).toContain('google-review-pulls');
    expect(CRON_JOBS.find(job => job.id === 'google-review-pulls')?.path).toBe(
      API_ROUTES.INTERNAL_CRON_GOOGLE_REVIEW_PULLS
    );
  });

  it('keeps every job on the shared daily slot', () => {
    expect(new Set(CRON_JOBS.map(job => job.schedule))).toEqual(
      new Set([CRON_DAILY_14_UTC])
    );
  });

  it('sends unfinished-setup notes on the daily run', () => {
    expect(CRON_JOBS.find(job => job.id === 'onboarding-emails')).toMatchObject(
      {
        path: API_ROUTES.INTERNAL_CRON_ONBOARDING_EMAILS,
        schedule: CRON_DAILY_14_UTC,
      }
    );
  });
});
