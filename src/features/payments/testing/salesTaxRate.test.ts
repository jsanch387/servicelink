import { describe, expect, it } from 'vitest';
import {
  MAX_SALES_TAX_PERCENT,
  formatSalesTaxRateLabel,
  parseSalesTaxPercent,
  salesTaxBpsToInput,
  salesTaxCents,
  salesTaxPercentToBps,
  sanitizeSalesTaxPercent,
} from '../utils/salesTaxRate';

describe('sanitizeSalesTaxPercent', () => {
  it('keeps a normal rate and two decimal places', () => {
    expect(sanitizeSalesTaxPercent('8.25')).toBe('8.25');
    expect(sanitizeSalesTaxPercent('8.259')).toBe('8.25');
    expect(sanitizeSalesTaxPercent('8.')).toBe('8.');
  });

  it('drops letters, signs, and extra dots', () => {
    expect(sanitizeSalesTaxPercent('8.25%')).toBe('8.25');
    expect(sanitizeSalesTaxPercent('-4')).toBe('4');
    expect(sanitizeSalesTaxPercent('8.2.9')).toBe('8.29');
    expect(sanitizeSalesTaxPercent('')).toBe('');
  });

  it('caps absurd amounts', () => {
    expect(sanitizeSalesTaxPercent('100')).toBe(String(MAX_SALES_TAX_PERCENT));
    expect(sanitizeSalesTaxPercent('999999999999')).toBe(
      String(MAX_SALES_TAX_PERCENT)
    );
    expect(sanitizeSalesTaxPercent('25.99')).toBe('25');
    expect(sanitizeSalesTaxPercent('008')).toBe('8');
  });
});

describe('parseSalesTaxPercent', () => {
  it('accepts a positive rate up to the cap', () => {
    expect(parseSalesTaxPercent('8.25')).toBe(8.25);
    expect(parseSalesTaxPercent('8.')).toBe(8);
    expect(parseSalesTaxPercent('25')).toBe(25);
    expect(parseSalesTaxPercent('0.5')).toBe(0.5);
  });

  it('rejects blank and zero', () => {
    expect(parseSalesTaxPercent('')).toBeNull();
    expect(parseSalesTaxPercent('.')).toBeNull();
    expect(parseSalesTaxPercent('0')).toBeNull();
    expect(parseSalesTaxPercent('0.00')).toBeNull();
  });

  it('stores an over-cap paste as the maximum rate', () => {
    expect(parseSalesTaxPercent('100')).toBe(MAX_SALES_TAX_PERCENT);
  });
});

describe('sales tax basis points', () => {
  it('converts a percent to hundredths and back', () => {
    expect(salesTaxPercentToBps(8.25)).toBe(825);
    expect(salesTaxBpsToInput(825)).toBe('8.25');
    expect(salesTaxBpsToInput(0)).toBe('');
    expect(salesTaxPercentToBps(100)).toBe(2500);
  });
});

describe('salesTaxCents', () => {
  it('adds 8.25% of $150 as $12.38', () => {
    expect(salesTaxCents(15_000, 825)).toBe(1238);
    expect(formatSalesTaxRateLabel(825)).toBe('8.25%');
  });

  it('charges nothing when the rate or the price is empty', () => {
    expect(salesTaxCents(15_000, 0)).toBe(0);
    expect(salesTaxCents(0, 825)).toBe(0);
    expect(salesTaxCents(15_000, 2501)).toBe(0);
  });
});
