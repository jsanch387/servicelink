import { describe, expect, it } from 'vitest';
import {
  buildBookingConfirmedSms,
  buildJobCompletedSms,
  buildJobStartedSms,
  buildOnMyWaySms,
  buildReviewRequestSms,
  buildWorkFinishedSms,
} from '../messages/bookingSms';

const OPT_OUT = 'Reply STOP to opt out.';

describe('booking SMS templates', () => {
  describe('buildBookingConfirmedSms', () => {
    const msg = buildBookingConfirmedSms({
      businessName: 'Black Label Detail',
      scheduledDate: '2026-06-15',
      startTime: '14:30',
    });

    it('includes business name, a human date/time, and opt-out', () => {
      expect(msg).toContain('Black Label Detail');
      expect(msg).toContain('confirmed');
      // Date formatted without timezone drift (Jun 15 stays Jun 15).
      expect(msg).toContain('Jun 15');
      expect(msg.endsWith(OPT_OUT)).toBe(true);
    });

    it('does not leak the raw YYYY-MM-DD or 24h time', () => {
      expect(msg).not.toContain('2026-06-15');
      expect(msg).not.toContain('14:30');
    });
  });

  describe('buildOnMyWaySms', () => {
    it('reads naturally and includes opt-out', () => {
      const msg = buildOnMyWaySms({ businessName: 'Black Label Detail' });
      expect(msg).toBe(
        `Black Label Detail is on the way for your appointment. ${OPT_OUT}`
      );
    });
  });

  describe('buildWorkFinishedSms', () => {
    it('tells the customer work is finished and includes opt-out', () => {
      const msg = buildWorkFinishedSms({ businessName: 'Black Label Detail' });
      expect(msg).toBe(
        `Black Label Detail has finished your service. Come take a look when you're ready. ${OPT_OUT}`
      );
    });
  });

  it('job_started and job_completed include business name + opt-out', () => {
    expect(buildJobStartedSms({ businessName: 'Acme' })).toBe(
      `Acme has started your service. ${OPT_OUT}`
    );
    expect(buildJobCompletedSms({ businessName: 'Acme' })).toBe(
      `Acme has completed your appointment. Thank you! ${OPT_OUT}`
    );
  });

  describe('buildReviewRequestSms', () => {
    const msg = buildReviewRequestSms({
      businessName: 'Black Label Detail',
      reviewUrl: 'https://servicelink.app/review/abc123',
    });

    it('thanks the customer, asks for a review, and includes the link + opt-out', () => {
      expect(msg).toContain('Black Label Detail');
      expect(msg).toContain('review');
      expect(msg).toContain('https://servicelink.app/review/abc123');
      expect(msg.endsWith(OPT_OUT)).toBe(true);
    });
  });

  it('all transactional templates fit in a single SMS segment (<=160 chars)', () => {
    const ctx = { businessName: 'Black Label Detailing Co.' };
    expect(buildOnMyWaySms(ctx).length).toBeLessThanOrEqual(160);
    expect(buildJobStartedSms(ctx).length).toBeLessThanOrEqual(160);
    expect(buildWorkFinishedSms(ctx).length).toBeLessThanOrEqual(160);
    expect(buildJobCompletedSms(ctx).length).toBeLessThanOrEqual(160);
  });
});
