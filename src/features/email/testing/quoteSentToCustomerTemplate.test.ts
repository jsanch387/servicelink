import {
  buildQuoteSentToCustomerHtml,
  getQuoteSentToCustomerSubject,
} from '@/features/email/quote-sent-to-customer/quoteSentToCustomerTemplate';
import { describe, expect, it } from 'vitest';

function basePayload() {
  return {
    customerName: 'Jane',
    serviceName: 'Full detail',
    businessName: 'Acme Detail',
    priceCents: 25000,
    scheduledDate: '2026-06-15',
    scheduledStartTime: '09:30:00',
    durationMinutes: 120,
    note: null as string | null,
    customerRequestMessage: null as string | null,
    vehicleLine: null as string | null,
    publicQuoteUrl: 'https://example.com/q/test-token',
  };
}

describe('getQuoteSentToCustomerSubject', () => {
  it('includes the business name', () => {
    expect(getQuoteSentToCustomerSubject('Acme Detail')).toBe(
      'Quote from Acme Detail'
    );
  });

  it('falls back when name is empty', () => {
    expect(getQuoteSentToCustomerSubject('  ')).toBe(
      'Quote from Your detailer'
    );
  });
});

describe('buildQuoteSentToCustomerHtml', () => {
  it('escapes HTML in dynamic fields', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      customerName: '<script>x</script>',
      serviceName: 'A & B "Co"',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
  });

  it('includes the review link href', () => {
    const html = buildQuoteSentToCustomerHtml(basePayload());
    expect(html).toContain('https://example.com/q/test-token');
  });

  it('shows customer-choose copy when schedule is omitted', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      scheduledDate: null,
      scheduledStartTime: null,
    });
    expect(html).toContain('You&#039;ll choose when you accept');
  });
});
