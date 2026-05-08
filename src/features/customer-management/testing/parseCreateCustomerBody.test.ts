import {
  CUSTOMER_NOTE_MAX_LENGTH,
  DUPLICATE_CUSTOMER_MESSAGE,
  INVALID_US_PHONE_MESSAGE,
  parseCreateCustomerBody,
} from '@/features/customer-management/utils/parseCreateCustomerBody';
import { describe, expect, it } from 'vitest';

describe('parseCreateCustomerBody', () => {
  it('rejects non-object body', () => {
    expect(parseCreateCustomerBody(null)).toEqual({
      ok: false,
      error: 'Invalid request body',
    });
    expect(parseCreateCustomerBody('x')).toEqual({
      ok: false,
      error: 'Invalid request body',
    });
  });

  it('rejects empty or missing name', () => {
    expect(parseCreateCustomerBody({ fullName: '' })).toMatchObject({
      ok: false,
      error: 'Name is required',
    });
    expect(parseCreateCustomerBody({ fullName: '   ' })).toMatchObject({
      ok: false,
      error: 'Name is required',
    });
    expect(parseCreateCustomerBody({})).toMatchObject({
      ok: false,
      error: 'Name is required',
    });
  });

  it('rejects invalid email when provided', () => {
    expect(
      parseCreateCustomerBody({
        fullName: 'Jane',
        email: 'not-email',
      })
    ).toMatchObject({
      ok: false,
      error: 'Please enter a valid email address',
    });
  });

  it('allows empty email', () => {
    const r = parseCreateCustomerBody({
      fullName: 'Jane',
      email: '',
      phone: '',
      notes: '',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.email).toBeNull();
      expect(r.emailNormalized).toBeNull();
    }
  });

  it('normalizes email when valid', () => {
    const r = parseCreateCustomerBody({
      fullName: 'Jane',
      email: ' Test@Example.COM ',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.emailNormalized).toBe('test@example.com');
      expect(r.email).toBe('test@example.com');
    }
  });

  it('normalizes valid 10-digit US phone', () => {
    const r = parseCreateCustomerBody({
      fullName: 'Jane',
      phone: '(555) 123-4567',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.phoneNormalized).toBe('5551234567');
      expect(r.phone).toBe('5551234567');
    }
  });

  it('allows blank phone', () => {
    const empty = parseCreateCustomerBody({
      fullName: 'Jane',
      phone: '',
    });
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.phoneNormalized).toBeNull();
      expect(empty.phone).toBeNull();
    }
  });

  it('rejects partial US phone when provided', () => {
    expect(
      parseCreateCustomerBody({
        fullName: 'Jane',
        phone: '555123456',
      })
    ).toMatchObject({
      ok: false,
      error: INVALID_US_PHONE_MESSAGE,
    });
  });

  it('rejects notes over max length', () => {
    const r = parseCreateCustomerBody({
      fullName: 'Jane',
      notes: 'x'.repeat(CUSTOMER_NOTE_MAX_LENGTH + 1),
    });
    expect(r).toMatchObject({
      ok: false,
      error: `Notes cannot exceed ${CUSTOMER_NOTE_MAX_LENGTH} characters`,
    });
  });

  it('returns trimmed notes or null when empty', () => {
    const withNote = parseCreateCustomerBody({
      fullName: 'Jane',
      notes: '  hello  ',
    });
    expect(withNote.ok).toBe(true);
    if (withNote.ok) expect(withNote.notes).toBe('hello');

    const noNote = parseCreateCustomerBody({
      fullName: 'Jane',
      notes: '   ',
    });
    expect(noNote.ok).toBe(true);
    if (noNote.ok) expect(noNote.notes).toBeNull();
  });

  it('exports duplicate message constant for API alignment', () => {
    expect(DUPLICATE_CUSTOMER_MESSAGE).toContain('already exists');
  });
});
