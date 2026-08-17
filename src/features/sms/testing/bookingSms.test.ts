import { describe, expect, it } from 'vitest';
import {
  buildBookingConfirmedSms,
  buildBookingReminderSms,
  buildJobCompletedInvoiceSms,
  buildJobCompletedSms,
  buildJobStartedSms,
  buildOnMyWaySms,
  buildReviewRequestSms,
  buildWorkFinishedSms,
  buildMembershipScheduleLinkSms,
  buildMembershipVisitReminderSms,
} from '../messages/bookingSms';

const OPT_OUT = 'Reply STOP to opt out.';

function expectOptOutBlock(msg: string, body: string) {
  expect(msg).toBe(`${body}\n\n${OPT_OUT}`);
}

describe('booking SMS templates (ServiceLink)', () => {
  describe('buildBookingConfirmedSms', () => {
    const msg = buildBookingConfirmedSms({
      scheduledDate: '2026-06-15',
      startTime: '14:30',
    });

    it('uses date/time without a business name, and ends with opt-out on its own line', () => {
      expectOptOutBlock(
        msg,
        'Your appointment is confirmed for Mon, Jun 15 at 2:30 PM. Questions? Contact your service provider.'
      );
      expect(msg).not.toMatch(/Black Label|Acme|business/i);
    });

    it('does not leak the raw YYYY-MM-DD or 24h time', () => {
      expect(msg).not.toContain('2026-06-15');
      expect(msg).not.toContain('14:30');
    });
  });

  describe('buildBookingReminderSms', () => {
    it('matches the reminder template', () => {
      const msg = buildBookingReminderSms({
        scheduledDate: '2026-06-15',
        startTime: '14:30',
      });
      expectOptOutBlock(
        msg,
        'Reminder: Your appointment is coming up on Mon, Jun 15 at 2:30 PM.'
      );
    });
  });

  it('lifecycle templates match ServiceLink copy', () => {
    expectOptOutBlock(
      buildOnMyWaySms({ businessName: 'Black Label Detail' }),
      'Black Label Detail is on the way for your appointment.'
    );
    expectOptOutBlock(buildJobStartedSms(), 'Your service has started.');
    expectOptOutBlock(
      buildWorkFinishedSms(),
      'Your service is finished and ready for you.'
    );
    expectOptOutBlock(
      buildJobCompletedSms(),
      'Your service is complete. Thank you!'
    );
  });

  describe('buildJobCompletedInvoiceSms (receipt)', () => {
    it('is receipt-only when not review-eligible', () => {
      const msg = buildJobCompletedInvoiceSms({
        invoiceUrl: 'https://app.test/i/abc',
      });
      expectOptOutBlock(msg, 'Your receipt is ready: https://app.test/i/abc');
      expect(msg).not.toContain('review');
    });

    it('adds a soft review ask in the same message when eligible', () => {
      const msg = buildJobCompletedInvoiceSms({
        invoiceUrl: 'https://app.test/i/abc',
        includeReviewHint: true,
      });
      expectOptOutBlock(
        msg,
        'Your receipt is ready: https://app.test/i/abc\nIf you can please leave us a review, we would appreciate that.'
      );
      expect(msg).not.toContain('/review/');
    });
  });

  describe('buildReviewRequestSms', () => {
    it('asks for a review with the link and no business name', () => {
      const msg = buildReviewRequestSms({
        reviewUrl: 'https://servicelink.app/review/abc123',
      });
      expectOptOutBlock(
        msg,
        'Enjoyed your service? Leave a quick review: https://servicelink.app/review/abc123'
      );
    });
  });

  describe('membership schedule SMS', () => {
    it('owner schedule link asks to book without saying the period started', () => {
      expectOptOutBlock(
        buildMembershipScheduleLinkSms({
          scheduleUrl: 'https://app.test/m/visit',
        }),
        'Book your next visit: https://app.test/m/visit'
      );
      expect(
        buildMembershipScheduleLinkSms({
          scheduleUrl: 'https://app.test/m/visit',
        })
      ).not.toMatch(/period started/i);
    });

    it('automatic period reminder still mentions the new period', () => {
      expectOptOutBlock(
        buildMembershipVisitReminderSms({
          scheduleUrl: 'https://app.test/m/visit',
        }),
        'Your membership period started. Book your next visit: https://app.test/m/visit'
      );
    });
  });

  it('fixed templates fit in a single SMS segment (<=160 chars)', () => {
    expect(
      buildOnMyWaySms({ businessName: 'Black Label Detailing Co.' }).length
    ).toBeLessThanOrEqual(160);
    expect(buildJobStartedSms().length).toBeLessThanOrEqual(160);
    expect(buildWorkFinishedSms().length).toBeLessThanOrEqual(160);
    expect(buildJobCompletedSms().length).toBeLessThanOrEqual(160);
  });
});
