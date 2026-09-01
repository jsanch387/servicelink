import { describe, expect, it } from 'vitest';
import { validatePublicQuoteRequestBody } from '@/features/quotes/public-request/validatePublicQuoteRequestBody';

const validBase = {
  businessSlug: 'acme-detail',
  customerName: 'Alex',
  customerEmail: 'alex@example.com',
  customerPhone: '4155550100',
  details: 'I spilled coffee on the seat and want it cleaned.',
};

describe('validatePublicQuoteRequestBody', () => {
  it('accepts a single ask field without a service title', () => {
    const r = validatePublicQuoteRequestBody(validBase);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.vehicleYear).toBeNull();
      expect(r.data.serviceName).toBe(validBase.details);
      expect(r.data.customerPhoneDigits).toBe('4155550100');
    }
  });

  it('accepts legacy serviceRequested when details is omitted', () => {
    const r = validatePublicQuoteRequestBody({
      businessSlug: 'acme-detail',
      customerName: 'Alex',
      customerEmail: 'alex@example.com',
      customerPhone: '4155550100',
      serviceRequested: 'Full detail',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.details).toBe('Full detail');
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

  it('accepts a complete second vehicle', () => {
    const r = validatePublicQuoteRequestBody({
      ...validBase,
      vehicleYear: '2017',
      vehicleMake: 'Toyota',
      vehicleModel: 'Tacoma',
      vehicle2Year: '2018',
      vehicle2Make: 'Honda',
      vehicle2Model: 'Civic',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.vehicle2Make).toBe('Honda');
    }
  });

  it('rejects details over max length', () => {
    const r = validatePublicQuoteRequestBody({
      ...validBase,
      details: 'x'.repeat(701),
    });
    expect(r.ok).toBe(false);
  });
});
