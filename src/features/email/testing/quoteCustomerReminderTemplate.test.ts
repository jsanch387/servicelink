import {
  buildQuoteCustomerReminderHtml,
  buildQuoteCustomerReminderPlainText,
  getQuoteCustomerReminderSubject,
} from '@/features/email/quote-customer-reminder/quoteCustomerReminderTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  customerName: 'Jane Doe',
  businessName: 'Acme Detail',
  serviceName: 'Full detail',
  publicQuoteUrl: 'https://myservicelink.app/q/test-token',
  expiresAt: '2026-09-16T18:00:00.000Z',
};

describe('quote customer reminder email', () => {
  it('includes the business in the subject', () => {
    expect(getQuoteCustomerReminderSubject('Acme Detail')).toBe(
      'Your quote from Acme Detail is still open'
    );
  });

  it('puts the same /q/ URL in html and plain text', () => {
    const html = buildQuoteCustomerReminderHtml(payload);
    const text = buildQuoteCustomerReminderPlainText(payload);
    expect(html).toContain('https://myservicelink.app/q/test-token');
    expect(text).toContain('https://myservicelink.app/q/test-token');
    expect(text).toContain(
      'Hey Jane, Acme Detail still has your quote open if you want to take a look.'
    );
  });

  it('escapes HTML in dynamic fields', () => {
    const html = buildQuoteCustomerReminderHtml({
      ...payload,
      customerName: '<script>x</script>',
      serviceName: 'A & B "Co"',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
  });
});
