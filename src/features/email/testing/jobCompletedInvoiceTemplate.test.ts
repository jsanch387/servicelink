import {
  buildJobCompletedInvoiceEmailHtml,
  buildJobCompletedInvoiceEmailPlainText,
  getJobCompletedInvoiceEmailSubject,
} from '@/features/email/job-completed/jobCompletedInvoiceTemplate';
import { describe, expect, it } from 'vitest';

const basePayload = {
  businessName: 'Urban Detailing',
  customerName: 'Walter T',
  invoiceUrl: 'https://example.com/i/abc123',
  includeReviewHint: false,
  serviceName: 'Full detail',
  scheduledDate: '2026-07-05',
  startTime: '14:30:00',
  totalCents: 12000,
};

describe('getJobCompletedInvoiceEmailSubject', () => {
  it('includes business name', () => {
    expect(getJobCompletedInvoiceEmailSubject('Urban Detailing')).toBe(
      'Your receipt from Urban Detailing'
    );
  });
});

describe('buildJobCompletedInvoiceEmailHtml', () => {
  it('uses shared ServiceLink layout with receipt CTA', () => {
    const html = buildJobCompletedInvoiceEmailHtml(basePayload);
    expect(html).toContain('Thanks for your visit');
    expect(html).toContain('https://example.com/i/abc123');
    expect(html).toContain('View receipt');
    expect(html).toContain('Visit summary');
    expect(html).toContain('Full detail');
    expect(html).toContain('$120.00');
    expect(html).toContain('ServiceLink');
    expect(html).not.toContain('I would appreciate');
  });

  it('escapes HTML in customer and business names', () => {
    const html = buildJobCompletedInvoiceEmailHtml({
      ...basePayload,
      customerName: '<script>',
      businessName: 'Biz & Co',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('Biz &amp; Co');
  });

  it('includes review CTA when eligible', () => {
    const html = buildJobCompletedInvoiceEmailHtml({
      ...basePayload,
      includeReviewHint: true,
      reviewUrl: 'https://example.com/review/tok',
    });
    expect(html).toContain('Leave a review');
    expect(html).toContain('https://example.com/review/tok');
    expect(html).toContain('Enjoyed your visit?');
  });

  it('omits review CTA when not eligible', () => {
    const html = buildJobCompletedInvoiceEmailHtml(basePayload);
    expect(html).not.toContain('Leave a review');
  });
});

describe('buildJobCompletedInvoiceEmailPlainText', () => {
  it('includes receipt URL and visit details', () => {
    const text = buildJobCompletedInvoiceEmailPlainText({
      ...basePayload,
      includeReviewHint: true,
      reviewUrl: 'https://example.com/review/tok',
    });
    expect(text).toContain('https://example.com/i/abc123');
    expect(text).toContain('Full detail');
    expect(text).toContain('https://example.com/review/tok');
    expect(text).toContain('Hi Walter T');
  });
});
