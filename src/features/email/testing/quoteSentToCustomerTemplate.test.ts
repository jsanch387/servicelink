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
    expect(html).toContain('width="100%"');
    expect(html).toContain('display:block;padding:14px 24px');
  });

  it('shows tax above the total when the quote includes tax', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      priceCents: 85_00,
      salesTax: { label: 'Tax (2.25%)', taxCents: 191 },
    });

    expect(html).toContain('Tax (2.25%)');
    expect(html).toContain('$1.91');
    expect(html).toContain('$86.91');
  });

  it('omits cards for details that were not provided', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      serviceName: '   ',
      vehicleLine: '   ',
      note: '   ',
      customerRequestMessage: '   ',
      salesTax: null,
      addonDetails: [{ name: '  ', priceCents: 20_00 }],
      payment: null,
      expiresAt: null,
    });

    expect(html).not.toMatch(/>\s*Vehicle\s*</);
    expect(html).not.toMatch(/>\s*Notes\s*</);
    expect(html).not.toMatch(/>\s*Payment\s*</);
    expect(html).not.toContain('Tax (');
    expect(html).not.toMatch(/>\s*Service\s*</);
  });

  it('shows customer-choose copy when schedule is omitted', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      scheduledDate: null,
      scheduledStartTime: null,
    });
    expect(html).toContain('You&#039;ll choose when you accept');
  });

  it('keeps payment in its own section', () => {
    const html = buildQuoteSentToCustomerHtml({
      ...basePayload(),
      priceCents: 85_00,
      salesTax: { label: 'Tax (2.25%)', taxCents: 191 },
      payment: { collection: 'customer_choice', depositCents: 10_00 },
    });

    const serviceAt = html.search(/>\s*Service\s*</);
    const whenAt = html.search(/>\s*When\s*</);
    const totalAt = html.search(/>\s*Total\s*</);
    const paymentAt = html.search(/>\s*Payment\s*</);
    expect(serviceAt).toBeGreaterThan(-1);
    expect(whenAt).toBeGreaterThan(serviceAt);
    expect(totalAt).toBeGreaterThan(whenAt);
    expect(paymentAt).toBeGreaterThan(totalAt);
    expect(html).toContain('You choose how to pay');
    expect(html).toContain(
      'Pay a $10 deposit, pay $86.91 in full, or pay in person.'
    );
  });
});
