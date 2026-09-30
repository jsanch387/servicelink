import { describe, expect, it } from 'vitest';

import {
  parseSaveInvoiceDraft,
  parseSendInvoiceDraft,
} from '../utils/parseSaveInvoiceDraft';
import { mapInvoiceListRow } from '../server/mapInvoiceListRow';

const validDraft = {
  customerName: 'Alex Rivera',
  customerPhone: '5125550199',
  customerEmail: 'Alex@Example.com',
  dueDate: '2026-11-10',
  note: 'Gate code 1234',
  lines: [
    { id: 'a', description: 'Full detail', quantity: '2', amount: '90' },
    { id: 'b', description: '', quantity: '1', amount: '' },
    { id: 'c', description: 'Pet hair', quantity: '1', amount: '25.50' },
  ],
};

describe('parseSaveInvoiceDraft', () => {
  it('keeps a priced draft and skips blank lines', () => {
    const parsed = parseSaveInvoiceDraft(validDraft);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.data.customerName).toBe('Alex Rivera');
    expect(parsed.data.customerEmail).toBe('alex@example.com');
    expect(parsed.data.customerPhone).toBe('5125550199');
    expect(parsed.data.dueOn).toBe('2026-11-10');
    expect(parsed.data.totalCents).toBe(20550);
    expect(parsed.data.lines).toEqual([
      {
        id: null,
        position: 0,
        description: 'Full detail',
        quantity: 2,
        unitAmountCents: 9000,
        amountCents: 18000,
      },
      {
        id: null,
        position: 1,
        description: 'Pet hair',
        quantity: 1,
        unitAmountCents: 2550,
        amountCents: 2550,
      },
    ]);
  });

  it('keeps an existing line id when the draft is opened again', () => {
    const lineId = '11111111-1111-4111-8111-111111111111';
    const parsed = parseSaveInvoiceDraft({
      ...validDraft,
      lines: [
        {
          id: lineId,
          description: 'Full detail',
          quantity: '1',
          amount: '90',
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.lines[0]?.id).toBe(lineId);
  });

  it('requires an email or a phone number before the invoice can be sent', () => {
    expect(
      parseSendInvoiceDraft({
        ...validDraft,
        customerEmail: '',
        customerPhone: '',
      })
    ).toEqual({
      ok: false,
      error: 'Add an email or a phone number.',
    });
    expect(parseSendInvoiceDraft({ ...validDraft, customerEmail: '' }).ok).toBe(
      true
    );
    expect(parseSendInvoiceDraft({ ...validDraft, customerPhone: '' }).ok).toBe(
      true
    );
  });

  it('requires a customer name and at least one priced service', () => {
    expect(
      parseSaveInvoiceDraft({ ...validDraft, customerName: '   ' })
    ).toEqual({ ok: false, error: "Add the customer's name." });

    expect(
      parseSaveInvoiceDraft({
        ...validDraft,
        lines: [{ description: '', quantity: '1', amount: '' }],
      })
    ).toEqual({ ok: false, error: 'Add at least one service.' });

    expect(
      parseSaveInvoiceDraft({
        ...validDraft,
        lines: [{ description: 'Wash', quantity: '1', amount: '' }],
      })
    ).toEqual({
      ok: false,
      error: 'Each service needs a description and a price.',
    });
  });

  it('rejects a partial phone, a bad email, and an impossible date', () => {
    expect(
      parseSaveInvoiceDraft({ ...validDraft, customerPhone: '512555' })
    ).toEqual({ ok: false, error: 'Enter a 10-digit phone number.' });

    expect(
      parseSaveInvoiceDraft({ ...validDraft, customerEmail: 'not-an-email' })
    ).toEqual({ ok: false, error: 'Enter a valid email.' });

    expect(
      parseSaveInvoiceDraft({ ...validDraft, dueDate: '2026-02-31' })
    ).toEqual({ ok: false, error: 'Choose a valid due date.' });
  });
});

describe('mapInvoiceListRow', () => {
  it('maps a draft row', () => {
    expect(
      mapInvoiceListRow({
        id: 'inv-1',
        status: 'draft',
        customer_name: 'Alex Rivera',
        total_cents: 20550,
        due_on: '2026-11-10',
        created_at: '2026-09-26T17:00:00.000Z',
        invoice_number: null,
      })
    ).toEqual({
      id: 'inv-1',
      status: 'draft',
      customerName: 'Alex Rivera',
      totalCents: 20550,
      dueOn: '2026-11-10',
      createdAt: '2026-09-26T17:00:00.000Z',
      invoiceNumber: null,
    });
  });

  it('drops rows with an unknown status', () => {
    expect(
      mapInvoiceListRow({
        id: 'inv-1',
        status: 'open',
        customer_name: 'Alex',
        total_cents: 100,
        due_on: null,
        created_at: '2026-09-26T17:00:00.000Z',
        invoice_number: null,
      })
    ).toBeNull();
  });
});
