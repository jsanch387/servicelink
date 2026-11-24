import { buildQuoteRequestOwnerNotificationHtml } from '@/features/email/quote-request-owner-notification/quoteRequestOwnerNotificationTemplate';
import { describe, expect, it } from 'vitest';

describe('buildQuoteRequestOwnerNotificationHtml', () => {
  it('escapes customer text and links to the dashboard', () => {
    const html = buildQuoteRequestOwnerNotificationHtml(
      {
        customerName: '<Jane>',
        serviceName: 'Wash & wax',
        vehicleSummary: null,
        timeline: null,
        detailsPreview: 'Line one\nLine two',
      },
      'https://example.com/dashboard/quotes'
    );

    expect(html).not.toContain('<Jane>');
    expect(html).toContain('&lt;Jane&gt;');
    expect(html).toContain('Wash &amp; wax');
    expect(html).toContain('https://example.com/dashboard/quotes');
    expect(html).toContain('Line one<br />Line two');
    expect(html).toContain('display:block;padding:14px 24px');
  });

  it('omits rows for fields the customer left blank', () => {
    const html = buildQuoteRequestOwnerNotificationHtml(
      {
        customerName: 'Jane Doe',
        serviceName: '   ',
        vehicleSummary: null,
        timeline: '  ',
        detailsPreview: 'Need a quote for my truck.',
      },
      'https://example.com/dashboard/quotes'
    );

    expect(html).toContain('Jane Doe');
    expect(html).toContain('Need a quote for my truck.');
    expect(html).not.toMatch(/>\s*Service\s*</);
    expect(html).not.toMatch(/>\s*Vehicle\s*</);
    expect(html).not.toMatch(/>\s*Timing\s*</);
  });
});
