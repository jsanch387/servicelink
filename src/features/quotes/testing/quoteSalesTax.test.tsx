import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { QuoteTaxTotal } from '../shared/components/QuoteTaxTotal';
import {
  quoteAmountDueCents,
  quoteSalesTax,
  quoteSalesTaxLabel,
} from '../shared/quoteSalesTax';

afterEach(() => {
  cleanup();
});

describe('quote sales tax', () => {
  it('adds tax once on the quoted price', () => {
    const quote = quoteSalesTax({
      priceCents: 85_00,
      taxEnabled: true,
      taxRateBps: 225,
    });

    expect(quote.taxCents).toBe(191);
    expect(quote.totalCents).toBe(86_91);
    expect(quoteAmountDueCents(85_00, 191)).toBe(86_91);
    expect(quoteSalesTaxLabel(quote.rateBps)).toBe('Tax (2.25%)');
  });

  it('leaves the quoted price alone when tax is off', () => {
    const quote = quoteSalesTax({
      priceCents: 85_00,
      taxEnabled: false,
      taxRateBps: 225,
    });

    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(85_00);
  });

  it('shows the tax line and the amount the customer pays', () => {
    render(
      <QuoteTaxTotal priceCents={85_00} taxCents={191} taxRateBps={225} />
    );

    expect(screen.getByText('Quote').nextElementSibling?.textContent).toBe(
      '$85'
    );
    expect(
      screen.getByText('Tax (2.25%)').nextElementSibling?.textContent
    ).toBe('$1.91');
    expect(screen.getByText('Total').nextElementSibling?.textContent).toBe(
      '$86.91'
    );
  });
});
