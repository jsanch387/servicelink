import { describe, expect, it } from 'vitest';

import {
  centsToInvoiceAmountInput,
  formatInvoiceDueDate,
  invoiceDraftFromStored,
  invoiceDraftTotalCents,
  parseInvoiceAmountToCents,
  parseInvoiceQuantity,
} from '../utils/invoiceDraft';

describe('parseInvoiceAmountToCents', () => {
  it('converts a dollar amount to cents', () => {
    expect(parseInvoiceAmountToCents('180')).toBe(18000);
    expect(parseInvoiceAmountToCents('12.5')).toBe(1250);
  });

  it('ignores empty and zero amounts', () => {
    expect(parseInvoiceAmountToCents('')).toBeNull();
    expect(parseInvoiceAmountToCents('0')).toBeNull();
    expect(parseInvoiceAmountToCents('.')).toBeNull();
  });
});

describe('parseInvoiceQuantity', () => {
  it('accepts a positive whole number', () => {
    expect(parseInvoiceQuantity('2')).toBe(2);
    expect(parseInvoiceQuantity('')).toBeNull();
    expect(parseInvoiceQuantity('0')).toBeNull();
  });
});

describe('formatInvoiceDueDate', () => {
  it('labels an empty date as due on receipt', () => {
    expect(formatInvoiceDueDate('')).toBe('On receipt');
    expect(formatInvoiceDueDate('2026-11-10')).toBe('November 10, 2026');
  });
});

describe('invoiceDraftFromStored', () => {
  it('fills the form from a saved draft', () => {
    expect(centsToInvoiceAmountInput(18000)).toBe('180');
    expect(centsToInvoiceAmountInput(2550)).toBe('25.50');

    expect(
      invoiceDraftFromStored({
        customerName: 'Alex Rivera',
        customerEmail: 'alex@example.com',
        customerPhone: '5125550199',
        note: 'Gate code',
        dueOn: '2026-11-10',
        lines: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            position: 0,
            description: 'Full detail',
            quantity: 2,
            unitAmountCents: 9000,
          },
        ],
      })
    ).toMatchObject({
      customerName: 'Alex Rivera',
      customerEmail: 'alex@example.com',
      customerPhone: '5125550199',
      dueDate: '2026-11-10',
      note: 'Gate code',
      lines: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          description: 'Full detail',
          quantity: '2',
          amount: '90',
        },
      ],
    });
  });
});

describe('invoiceDraftTotalCents', () => {
  it('multiplies quantity by unit price and skips empty lines', () => {
    expect(
      invoiceDraftTotalCents([
        { id: 'a', description: 'Full detail', quantity: '2', amount: '90' },
        { id: 'b', description: '', quantity: '1', amount: '' },
        { id: 'c', description: 'Pet hair', quantity: '1', amount: '25.50' },
      ])
    ).toBe(20550);
  });
});
