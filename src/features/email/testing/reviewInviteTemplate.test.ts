import {
  buildReviewInviteEmailHtml,
  buildReviewInviteEmailPlainText,
  getReviewInviteEmailSubject,
} from '@/features/email/review-invite/reviewInviteTemplate';
import { describe, expect, it } from 'vitest';

describe('getReviewInviteEmailSubject', () => {
  it('includes business name', () => {
    expect(getReviewInviteEmailSubject('Acme')).toBe(
      'How was your visit with Acme?'
    );
  });
});

const basePayload = {
  customerName: 'Alex',
  businessName: 'Black Label Auto',
  serviceName: 'Full detail',
  scheduledDate: '2026-06-01',
  scheduledStartTime: '09:30:00',
  publicReviewUrl: 'https://example.com/review/tok',
};

describe('buildReviewInviteEmailHtml', () => {
  it('escapes HTML and includes review URL', () => {
    const html = buildReviewInviteEmailHtml({
      ...basePayload,
      customerName: '<script>',
      businessName: 'Biz & Co',
    });
    expect(html).toContain('https://example.com/review/tok');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Biz &amp; Co');
  });

  it('uses dark premium layout with white CTA', () => {
    const html = buildReviewInviteEmailHtml(basePayload);
    expect(html).toContain('#0f0f0f');
    expect(html).toContain('background-color:#ffffff');
    expect(html).toContain('How did we do?');
    expect(html).not.toContain('#2563eb');
  });
});

describe('buildReviewInviteEmailPlainText', () => {
  it('includes review URL and visit details', () => {
    const text = buildReviewInviteEmailPlainText(basePayload);
    expect(text).toContain('https://example.com/review/tok');
    expect(text).toContain('Full detail');
    expect(text).toContain('Hey Alex');
  });
});
