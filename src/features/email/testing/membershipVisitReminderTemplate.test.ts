import {
  buildMembershipVisitReminderHtml,
  buildMembershipVisitReminderPlainText,
  getMembershipVisitReminderSubject,
} from '@/features/email/membership-visit-reminder/membershipVisitReminderTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Tessa',
  planName: 'Super Maintenance',
  scheduleUrl: 'https://example.com/urban-detailing/membership/visit?token=abc',
};

describe('getMembershipVisitReminderSubject', () => {
  it('names the business, not ServiceLink', () => {
    expect(getMembershipVisitReminderSubject('Urban Detailing')).toBe(
      'Schedule your visit with Urban Detailing'
    );
  });
});

describe('buildMembershipVisitReminderHtml', () => {
  it('uses shared layout with business-first copy and no ServiceLink header', () => {
    const html = buildMembershipVisitReminderHtml(payload);
    expect(html).toContain('Schedule your visit');
    expect(html).toContain(
      'Hi Tessa, a new period of Super Maintenance with Urban Detailing started. Schedule your included visit.'
    );
    expect(html).toContain('Schedule visit');
    expect(html).toContain(payload.scheduleUrl);
    expect(html).toContain('Sent for Urban Detailing via ServiceLink');
    expect(html).not.toContain('>ServiceLink</span>');
    expect(html).not.toContain('letter-spacing:1.4px');
  });

  it('owner schedule-link copy skips “new period started”', () => {
    const html = buildMembershipVisitReminderHtml({
      ...payload,
      kind: 'schedule_link',
    });
    expect(html).toContain(
      'Hi Tessa, your Super Maintenance with Urban Detailing includes a visit this period. Pick a date and time that works for you.'
    );
    expect(html).not.toMatch(/new period/i);
    expect(html).not.toMatch(/started\./i);
  });
});

describe('buildMembershipVisitReminderPlainText', () => {
  it('keeps the same customer copy', () => {
    const text = buildMembershipVisitReminderPlainText(payload);
    expect(text).toContain('Hi Tessa, a new period of Super Maintenance');
    expect(text).toContain(payload.scheduleUrl);
    expect(text).toContain('Sent for Urban Detailing via ServiceLink');
    expect(text).not.toContain('— ServiceLink');
  });

  it('owner schedule-link plain text matches', () => {
    const text = buildMembershipVisitReminderPlainText({
      ...payload,
      kind: 'schedule_link',
    });
    expect(text).toContain(
      'Hi Tessa, your Super Maintenance with Urban Detailing includes a visit this period.'
    );
    expect(text).not.toMatch(/new period/i);
  });
});
