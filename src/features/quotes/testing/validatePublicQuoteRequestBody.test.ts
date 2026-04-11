import { describe, expect, it } from 'vitest';
import { validatePublicQuoteRequestBody } from '@/features/quotes/public-request/validatePublicQuoteRequestBody';

const validBase = {
  businessSlug: 'acme-detail',
  customerName: 'Alex',
  customerEmail: 'alex@example.com',
  customerPhone: '4155550100',
  serviceRequested: 'Full detail',
  details: 'Interior needs shampoo.',
};

describe('validatePublicQuoteRequestBody', () => {
  it('accepts minimal valid body without vehicle', () => {
    const r = validatePublicQuoteRequestBody(validBase);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.vehicleYear).toBeNull();
      expect(r.data.customerPhoneDigits).toBe('4155550100');
    }
  });

  it('requires all vehicle fields when any is present', () => {
    const r = validatePublicQuoteRequestBody({
      ...validBase,
      vehicleYear: '2020',
      vehicleMake: '',
      vehicleModel: 'Camry',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects details over max length', () => {
    const r = validatePublicQuoteRequestBody({
      ...validBase,
      details: 'x'.repeat(701),
    });
    expect(r.ok).toBe(false);
  });
});
