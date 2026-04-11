import { parseDeleteQuoteApiResponse } from '@/features/quotes/dashboard/utils/parseDeleteQuoteApiResponse';
import { describe, expect, it } from 'vitest';

describe('parseDeleteQuoteApiResponse', () => {
  it('accepts HTTP 200 with success true', () => {
    expect(parseDeleteQuoteApiResponse(true, 200, { success: true })).toEqual({
      ok: true,
    });
  });

  it('rejects when success is false with server error message', () => {
    const r = parseDeleteQuoteApiResponse(false, 500, {
      success: false,
      error: 'Failed to delete quote',
    });
    expect(r).toEqual({ ok: false, error: 'Failed to delete quote' });
  });

  it('maps 404 without body message', () => {
    const r = parseDeleteQuoteApiResponse(false, 404, { success: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('Quote not found.');
  });

  it('maps 403 without body message', () => {
    const r = parseDeleteQuoteApiResponse(false, 403, null);
    expect(r).toEqual({
      ok: false,
      error: 'You do not have permission to delete this quote.',
    });
  });

  it('falls back when HTTP ok but body missing success', () => {
    const r = parseDeleteQuoteApiResponse(true, 200, { success: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('try again');
  });
});
