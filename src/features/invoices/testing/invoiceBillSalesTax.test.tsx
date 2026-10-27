import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InvoiceBillPreview } from '../components/InvoiceBillPreview';
import { PublicInvoiceBill } from '../components/PublicInvoiceBill';
import { createEmptyInvoiceDraft } from '../utils/invoiceDraft';

afterEach(() => {
  cleanup();
});

describe('invoice bill sales tax', () => {
  it('shows tax on the draft preview and the amount due', () => {
    const draft = createEmptyInvoiceDraft();
    draft.lines[0] = {
      ...draft.lines[0],
      description: 'Exterior Wash',
      amount: '85',
    };

    render(
      <InvoiceBillPreview
        businessName="Urban Detailing"
        draft={draft}
        salesTaxEnabled
        salesTaxRateBps={225}
      />
    );

    expect(screen.getByText('Subtotal').nextElementSibling?.textContent).toBe(
      '$85.00'
    );
    expect(screen.getByText('Tax (2.25%)').nextElementSibling?.textContent).toBe(
      '$1.91'
    );
    expect(screen.getByText('Amount due').nextElementSibling?.textContent).toBe(
      '$86.91'
    );
  });

  it('shows the stored tax on the customer bill', () => {
    render(
      <PublicInvoiceBill
        invoice={{
          businessName: 'Urban Detailing',
          invoiceNumber: 1001,
          status: 'sent',
          customerName: 'Jane',
          customerEmail: null,
          customerPhone: null,
          dueOn: null,
          note: null,
          subtotalCents: 85_00,
          taxCents: 191,
          taxRateBps: 225,
          totalCents: 86_91,
          lines: [
            {
              id: 'line-1',
              description: 'Exterior Wash',
              quantity: 1,
              unitAmountCents: 85_00,
              amountCents: 85_00,
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Tax (2.25%)')).toBeTruthy();
    expect(screen.getByText('$1.91')).toBeTruthy();
    expect(screen.getByText('$86.91')).toBeTruthy();
  });
});
