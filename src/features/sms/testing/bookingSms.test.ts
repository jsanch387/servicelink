import { describe, expect, it } from 'vitest';
import {
  buildBookingConfirmedSms,
  buildBookingReminderSms,
  buildCustomerInvoiceSms,
  buildJobCompletedInvoiceSms,
  buildJobCompletedSms,
  buildJobStartedSms,
  buildOnMyWaySms,
  buildQuoteReminderSms,
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
      businessName: 'Black Label Detail',
      scheduledDate: '2026-06-15',
      startTime: '14:30',
    });

    it('names the business, includes date/time, and ends with opt-out on its own line', () => {
      expectOptOutBlock(
        msg,
        'Your appointment with Black Label Detail is confirmed for Mon, Jun 15 at 2:30 PM.'
      );
    });

    it('does not leak the raw YYYY-MM-DD or 24h time', () => {
      expect(msg).not.toContain('2026-06-15');
      expect(msg).not.toContain('14:30');
    });
  });

  describe('buildBookingReminderSms', () => {
    it('matches the reminder template', () => {
      const msg = buildBookingReminderSms({
        businessName: 'Black Label Detail',
        scheduledDate: '2026-06-15',
        startTime: '14:30',
      });
      expectOptOutBlock(
        msg,
        'Reminder: Your appointment with Black Label Detail is coming up on Mon, Jun 15 at 2:30 PM.'
      );
    });
  });

  it('lifecycle templates match ServiceLink copy', () => {
    expectOptOutBlock(
      buildOnMyWaySms({ businessName: 'Black Label Detail' }),
      'Black Label Detail is on the way for your appointment.'
    );
    expectOptOutBlock(
      buildJobStartedSms({ businessName: 'Black Label Detail' }),
      'Black Label Detail has started your service.'
    );
    expectOptOutBlock(
      buildWorkFinishedSms({ businessName: 'Black Label Detail' }),
      'Black Label Detail has finished your service.'
    );
    expectOptOutBlock(
      buildJobCompletedSms({ businessName: 'Black Label Detail' }),
      'Black Label Detail has completed your appointment. Thank you!'
    );
  });

  describe('buildJobCompletedInvoiceSms (receipt)', () => {
    it('is receipt-only when not review-eligible', () => {
      const msg = buildJobCompletedInvoiceSms({
        businessName: 'Black Label Detail',
        invoiceUrl: 'https://app.test/i/abc',
      });
      expectOptOutBlock(
        msg,
        'Black Label Detail: Your receipt is ready: https://app.test/i/abc'
      );
      expect(msg).not.toContain('review');
    });

    it('adds a soft review ask in the same message when eligible', () => {
      const msg = buildJobCompletedInvoiceSms({
        businessName: 'Black Label Detail',
        invoiceUrl: 'https://app.test/i/abc',
        includeReviewHint: true,
      });
      expectOptOutBlock(
        msg,
        'Black Label Detail: Your receipt is ready: https://app.test/i/abc\nIf you can please leave us a review, we would appreciate that.'
      );
      expect(msg).not.toContain('/review/');
    });
  });

  describe('buildReviewRequestSms', () => {
    it('asks for a review with the business name and the link', () => {
      const msg = buildReviewRequestSms({
        businessName: 'Black Label Detail',
        reviewUrl: 'https://servicelink.app/review/abc123',
      });
      expectOptOutBlock(
        msg,
        'Enjoyed your service from Black Label Detail? Leave a quick review: https://servicelink.app/review/abc123'
      );
    });
  });

  describe('buildCustomerInvoiceSms', () => {
    it('sends the bill link, the business name, and the opt-out', () => {
      const url = 'https://myservicelink.app/b/K7mN2pQx';
      expectOptOutBlock(
        buildCustomerInvoiceSms({
          businessName: 'Black Label Detail',
          invoiceUrl: url,
        }),
        `Black Label Detail: Your invoice is ready: ${url}`
      );
      expect(
        buildCustomerInvoiceSms({
          businessName: 'Black Label Detail',
          invoiceUrl: url,
        })
      ).not.toMatch(/sale|discount|offer|unsubscribe/i);
    });
  });

  describe('buildQuoteReminderSms', () => {
    it('includes the same /q/ link as the email and the opt-out', () => {
      const url = 'https://myservicelink.app/q/abc123';
      const msg = buildQuoteReminderSms({
        lead: 'Hey Jane, Acme Detail still has your quote open if you want to take a look.',
        publicQuoteUrl: url,
      });
      expectOptOutBlock(
        msg,
        `Hey Jane, Acme Detail still has your quote open if you want to take a look. ${url}`
      );
    });
  });

  describe('membership schedule SMS', () => {
    it('owner schedule link asks to book without saying the period started', () => {
      expectOptOutBlock(
        buildMembershipScheduleLinkSms({
          businessName: 'Black Label Detail',
          scheduleUrl: 'https://app.test/m/visit',
        }),
        'Black Label Detail: Your subscription needs a date for the next visit: https://app.test/m/visit'
      );
      expect(
        buildMembershipScheduleLinkSms({
          businessName: 'Black Label Detail',
          scheduleUrl: 'https://app.test/m/visit',
        })
      ).not.toMatch(/period started/i);
    });

    it('automatic period reminder still mentions the new period', () => {
      expectOptOutBlock(
        buildMembershipVisitReminderSms({
          businessName: 'Black Label Detail',
          scheduleUrl: 'https://app.test/m/visit',
        }),
        'Black Label Detail: Your subscription period started. Schedule your visit: https://app.test/m/visit'
      );
    });
  });

  it('fixed templates fit in a single SMS segment (<=160 chars)', () => {
    expect(
      buildOnMyWaySms({ businessName: 'Black Label Detailing Co.' }).length
    ).toBeLessThanOrEqual(160);
    expect(
      buildJobStartedSms({ businessName: 'Black Label Detailing Co.' }).length
    ).toBeLessThanOrEqual(160);
    expect(
      buildWorkFinishedSms({ businessName: 'Black Label Detailing Co.' }).length
    ).toBeLessThanOrEqual(160);
    expect(
      buildJobCompletedSms({ businessName: 'Black Label Detailing Co.' }).length
    ).toBeLessThanOrEqual(160);
  });
});
