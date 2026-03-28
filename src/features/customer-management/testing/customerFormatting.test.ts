import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import { describe, expect, it } from 'vitest';

describe('formatCustomerPhone', () => {
  it('formats 10-digit US numbers', () => {
    expect(formatCustomerPhone('5551234567')).toBe('(555) 123-4567');
    expect(formatCustomerPhone('555-123-4567')).toBe('(555) 123-4567');
    expect(formatCustomerPhone('(555) 123-4567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit US numbers with country code 1', () => {
    expect(formatCustomerPhone('15551234567')).toBe('+1 (555) 123-4567');
    expect(formatCustomerPhone('+15551234567')).toBe('+1 (555) 123-4567');
    expect(formatCustomerPhone('+1 555 123 4567')).toBe('+1 (555) 123-4567');
  });

  it('formats 7-digit local numbers', () => {
    expect(formatCustomerPhone('5551234')).toBe('555-1234');
  });

  it('groups other digit lengths for readability (e.g. intl stored without punctuation)', () => {
    expect(formatCustomerPhone('+447700900123')).toBe('+447 700 900 123');
    expect(formatCustomerPhone('447700900123')).toBe('447 700 900 123');
  });

  it('shows extension after a middle dot', () => {
    expect(formatCustomerPhone('5551234567 ext 104')).toBe(
      '(555) 123-4567 · ext. 104'
    );
    expect(formatCustomerPhone('5551234567 x9')).toBe(
      '(555) 123-4567 · ext. 9'
    );
    expect(formatCustomerPhone('5551234567x9')).toBe('(555) 123-4567 · ext. 9');
    expect(formatCustomerPhone('+15551234567 EXT. 22')).toBe(
      '+1 (555) 123-4567 · ext. 22'
    );
  });

  it('returns trimmed original when there are no dial digits', () => {
    expect(formatCustomerPhone('   ')).toBe('');
    expect(formatCustomerPhone('ask for mobile')).toBe('ask for mobile');
  });
});

describe('customerPhoneHref', () => {
  it('uses main number digits only (no extension in tel:)', () => {
    expect(customerPhoneHref('5551234567 ext 9')).toBe('tel:5551234567');
  });

  it('returns null when there is no dialable number', () => {
    expect(customerPhoneHref('')).toBe(null);
    expect(customerPhoneHref('n/a')).toBe(null);
  });
});
