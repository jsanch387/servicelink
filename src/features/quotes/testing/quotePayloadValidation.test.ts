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

  it('accepts omitting both scheduled date and time', () => {
    const {
      scheduledDate: _d,
      scheduledStartTime: _t,
      ...rest
    } = validPayload();
    const r = validateQuotePayloadFields(rest);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.scheduledDate).toBeNull();
    expect(r.data.scheduledStartTimeForDb).toBeNull();
  });

  it('rejects providing only scheduled date', () => {
    const r = validateQuotePayloadFields({
      ...validPayload(),
      scheduledStartTime: undefined,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe(
      'Provide both scheduled date and start time, or omit both'
    );
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
