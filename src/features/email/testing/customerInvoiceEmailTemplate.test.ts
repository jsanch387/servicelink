import { describe, expect, it } from 'vitest';

import {
  buildCustomerInvoiceEmailHtml,
  buildCustomerInvoiceEmailText,
  customerInvoiceEmailLooksTransactional,
  customerInvoiceEmailSubject,
} from '../customer-invoice/customerInvoiceEmailTemplate';

const payload = {
  businessName: 'Northside Detail',
  customerName: 'Alex Rivera',
  invoiceNumber: 1001,
  totalCents: 18000,
  dueOn: '2026-11-10',
  invoiceUrl: 'https://myservicelink.app/b/K7mN2pQx',
};

describe('customer invoice email', () => {
  it('uses a specific subject and puts the short link in the plain text', () => {
    expect(customerInvoiceEmailSubject(payload)).toBe(
      'Invoice 1001 from Northside Detail'
    );

    const text = buildCustomerInvoiceEmailText(payload);
    expect(text).toContain('https://myservicelink.app/b/K7mN2pQx');
    expect(text).toContain('Amount due');
    expect(text).toContain('November 10, 2026');
    expect(text).not.toMatch(/sale|discount|offer|unsubscribe/i);
  });

  it('stays transactional in both the html and the plain text', () => {
    const html = buildCustomerInvoiceEmailHtml(payload);
    const text = buildCustomerInvoiceEmailText(payload);
    expect(html).toContain('View invoice');
    expect(html.match(/https:\/\/myservicelink\.app\/b\/K7mN2pQx/g)).toEqual([
      'https://myservicelink.app/b/K7mN2pQx',
    ]);
    expect(customerInvoiceEmailLooksTransactional(html, text)).toBe(true);
  });

  it('lists tax above the amount due when the bill includes tax', () => {
    const text = buildCustomerInvoiceEmailText({
      ...payload,
      totalCents: 86_91,
      salesTax: { label: 'Tax (2.25%)', taxCents: 191 },
    });
    const html = buildCustomerInvoiceEmailHtml({
      ...payload,
      totalCents: 86_91,
      salesTax: { label: 'Tax (2.25%)', taxCents: 191 },
    });

    expect(text).toContain('Subtotal: $85.00');
    expect(text).toContain('Tax (2.25%): $1.91');
    expect(text).toContain('Amount due: $86.91');
    expect(html).toContain('Tax (2.25%)');
    expect(html).toContain('$86.91');
  });
});
