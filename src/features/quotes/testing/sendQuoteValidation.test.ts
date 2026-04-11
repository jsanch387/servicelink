import {
  normalizeOptionalPhoneDigits,
  toTimeWithSeconds,
  validateSendQuoteBody,
} from '@/features/quotes/send/validateSendQuoteBody';
import { describe, expect, it } from 'vitest';

function validBody() {
  return {
    businessSlug: 'acme-detail',
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

describe('validateSendQuoteBody', () => {
  it('accepts a complete valid payload and normalizes fields', () => {
    const result = validateSendQuoteBody(validBody());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.businessSlug).toBe('acme-detail');
    expect(result.data.customerPhoneDigits).toBe('5551234567');
    expect(result.data.scheduledStartTimeForDb).toBe('09:30:00');
    expect(result.data.note).toBeNull();
  });

  it('rejects missing business slug', () => {
    const result = validateSendQuoteBody({ ...validBody(), businessSlug: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Business slug is required');
    expect(result.status).toBe(400);
  });

  it('rejects invalid email', () => {
    const result = validateSendQuoteBody({
      ...validBody(),
      customerEmail: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('A valid customer email is required');
  });

  it('rejects phone that is present but not 10 digits', () => {
    const result = validateSendQuoteBody({
      ...validBody(),
      customerPhone: '12345',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Phone must be 10 digits or omitted');
  });

  it('allows omitting phone', () => {
    const { customerPhone: _p, ...rest } = validBody();
    const result = validateSendQuoteBody(rest);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.customerPhoneDigits).toBeNull();
  });

  it('rejects non-integer or negative price', () => {
    expect(validateSendQuoteBody({ ...validBody(), priceCents: 10.5 }).ok).toBe(
      false
    );
    expect(validateSendQuoteBody({ ...validBody(), priceCents: -1 }).ok).toBe(
      false
    );
  });

  it('rejects invalid duration', () => {
    expect(
      validateSendQuoteBody({ ...validBody(), durationMinutes: 0 }).ok
    ).toBe(false);
    expect(
      validateSendQuoteBody({ ...validBody(), durationMinutes: 1.5 }).ok
    ).toBe(false);
  });

  it('rejects bad date or time format', () => {
    expect(
      validateSendQuoteBody({ ...validBody(), scheduledDate: '04-15-2026' }).ok
    ).toBe(false);
    expect(
      validateSendQuoteBody({ ...validBody(), scheduledStartTime: '9:30' }).ok
    ).toBe(false);
  });
});

describe('toTimeWithSeconds', () => {
  it('appends :00 for HH:mm', () => {
    expect(toTimeWithSeconds('14:05')).toBe('14:05:00');
  });
});

describe('normalizeOptionalPhoneDigits', () => {
  it('returns null for empty or non-10-digit input', () => {
    expect(normalizeOptionalPhoneDigits(undefined)).toBeNull();
    expect(normalizeOptionalPhoneDigits('')).toBeNull();
    expect(normalizeOptionalPhoneDigits('123')).toBeNull();
  });
});
