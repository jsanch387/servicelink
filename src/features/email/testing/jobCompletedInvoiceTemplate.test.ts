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
  it('uses shared layout with receipt CTA (no ServiceLink header mark)', () => {
    const html = buildJobCompletedInvoiceEmailHtml(basePayload);
    expect(html).toContain('Thanks for your visit');
    expect(html).toContain('https://example.com/i/abc123');
    expect(html).toContain('View receipt');
    expect(html).toContain('Visit summary');
    expect(html).toContain('Full detail');
    expect(html).toContain('$120.00');
    expect(html).not.toContain('>ServiceLink</span>');
    expect(html).toContain('ServiceLink'); // footer copyright
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

  it('multi-job receipt lists jobs and keeps View receipt CTA', () => {
    const html = buildJobCompletedInvoiceEmailHtml({
      ...basePayload,
      serviceName: '2 jobs',
      totalCents: 390_10,
      subtotalCents: 430_00,
      discount: {
        label: 'Summer Sale — 10% off',
        discountCents: 39_90,
      },
      jobs: [
        {
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 210_00,
          durationMinutes: 150,
          customerVehicleYear: '2016',
          customerVehicleMake: 'Chevy',
          customerVehicleModel: 'Cruze',
          selectedAddOns: [{ name: 'Pet hair removal', priceCents: 20_00 }],
        },
        {
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 200_00,
          durationMinutes: 60,
        },
      ],
    });
    expect(html).toContain('Jobs');
    expect(html).toContain('Pricing');
    expect(html).toContain('Signature Shinee');
    expect(html).toContain('SUV');
    expect(html).toContain('2016 Chevy Cruze');
    expect(html).toContain('Pet hair removal');
    expect(html).toContain('$210.00');
    expect(html).toContain('$200.00');
    expect(html).toContain('$20.00');
    expect(html).toContain('Subtotal');
    expect(html).toContain('$430.00');
    expect(html).toContain('Summer Sale — 10% off');
    expect(html).toContain('-$39.90');
    expect(html).toContain('$390.10');
    expect(html).toContain('View receipt');
    expect(html).toContain('2 jobs');
    expect(html).not.toContain('>Service<');
  });

  it('omits sale line when no discount', () => {
    const html = buildJobCompletedInvoiceEmailHtml({
      ...basePayload,
      jobs: [
        {
          serviceName: 'Basic wash',
          servicePriceCents: 40_00,
          durationMinutes: 45,
        },
      ],
      totalCents: 40_00,
      subtotalCents: 40_00,
      discount: null,
    });
    expect(html).toContain('Pricing');
    expect(html).toContain('$40.00');
    expect(html).not.toContain('Subtotal');
    expect(html).not.toContain('Summer Sale');
  });

  it('omits vehicle and option when not provided on a job', () => {
    const html = buildJobCompletedInvoiceEmailHtml({
      ...basePayload,
      jobs: [
        {
          serviceName: 'Basic wash',
          servicePriceCents: 40_00,
          durationMinutes: 45,
        },
      ],
    });
    expect(html).toContain('Basic wash');
    expect(html).toContain('$40.00');
    expect(html).not.toContain('Vehicle');
    expect(html).not.toContain('SUV');
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
