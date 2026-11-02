import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { buildInvoicePdf } from '../server/buildInvoicePdf';

import type { PublicInvoiceBillModel } from '../components/PublicInvoiceBill';

function bill(
  overrides: Partial<PublicInvoiceBillModel> = {}
): PublicInvoiceBillModel {
  return {
    businessName: 'Urban Detailingg',
    invoiceNumber: 1001,
    status: 'sent',
    customerName: 'Jesus Sanchez',
    customerEmail: 'jesus@example.com',
    customerPhone: '5807545207',
    dueOn: '2026-10-10',
    note: 'Full detail done and complete',
    totalCents: 20000,
    lines: [
      {
        id: 'line-1',
        description: 'Full detail',
        quantity: 1,
        unitAmountCents: 20000,
        amountCents: 20000,
      },
    ],
    ...overrides,
  };
}

describe('buildInvoicePdf', () => {
  it('builds a one-page bill', async () => {
    const bytes = await buildInvoicePdf(bill());
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-');

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('continues a long bill onto another page', async () => {
    const lines = Array.from({ length: 40 }, (_, index) => ({
      id: `line-${index}`,
      description: `Service line ${index + 1} with a longer description`,
      quantity: 2,
      unitAmountCents: 1500,
      amountCents: 3000,
    }));

    const bytes = await buildInvoicePdf(
      bill({ lines, totalCents: 3000 * lines.length, note: null })
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });
});
