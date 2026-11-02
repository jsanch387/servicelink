import { describe, expect, it } from 'vitest';
import {
  isOwnerEmailAllowedForSalesTax,
  SALES_TAX_ROLLOUT_OPEN_TO_ALL,
} from '../config/salesTaxRolloutAllowlist';

describe('salesTaxRolloutAllowlist', () => {
  it('stays closed to everyone except the prod test email', () => {
    expect(SALES_TAX_ROLLOUT_OPEN_TO_ALL).toBe(false);
    expect(isOwnerEmailAllowedForSalesTax('jesuss387@gmail.com')).toBe(true);
    expect(isOwnerEmailAllowedForSalesTax('JESUSS387@gmail.com')).toBe(true);
    expect(isOwnerEmailAllowedForSalesTax('owner@example.com')).toBe(false);
    expect(isOwnerEmailAllowedForSalesTax(null)).toBe(false);
  });
});
