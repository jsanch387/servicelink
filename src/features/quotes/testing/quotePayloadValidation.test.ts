import { validateSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import { validateQuotePayloadFields } from '@/features/quotes/shared/validateQuotePayloadFields';
import { describe, expect, it } from 'vitest';

function validPayload() {
  return {
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '(555) 123-4567',
    serviceName: 'Full detail',
    priceCents: 19900,
    durationMinutes: 120,
    scheduledDate: '2026-04-15',
    scheduledStartTime: '09:30',
  };
}

describe('validateQuotePayloadFields', () => {
  it('accepts a valid payload', () => {
    const r = validateQuotePayloadFields(validPayload());
    expect(r.ok).toBe(true);
  });

  it('rejects missing customer name', () => {
    const r = validateQuotePayloadFields({
      ...validPayload(),
      customerName: '',
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('Customer name is required');
  });
});

describe('validateSendQuoteBody + shared core', () => {
  it('still requires business slug before field validation', () => {
    const r = validateSendQuoteBody({ ...validPayload(), businessSlug: '' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('Business slug is required');
  });
});
