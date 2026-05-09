import {
  getQuoteSendRequestId,
  maskEmailForLog,
  quoteSendJsonResponse,
  shortUserIdForLog,
  supabaseErrorForLogs,
  truncateLogDetail,
} from '@/features/quotes/server/quoteSendRouteLog';
import { describe, expect, it } from 'vitest';

function headersFrom(
  entries: Record<string, string>
): Pick<Request, 'headers'> {
  return { headers: new Headers(entries) };
}

describe('getQuoteSendRequestId', () => {
  it('prefers X-Request-ID', () => {
    const id = getQuoteSendRequestId(
      headersFrom({
        'x-request-id': 'req-from-mobile',
        'x-correlation-id': 'corr-other',
      })
    );
    expect(id).toBe('req-from-mobile');
  });

  it('falls back to X-Correlation-ID', () => {
    const id = getQuoteSendRequestId(
      headersFrom({ 'x-correlation-id': 'corr-xyz' })
    );
    expect(id).toBe('corr-xyz');
  });

  it('trims and caps length', () => {
    const long = 'x'.repeat(200);
    const id = getQuoteSendRequestId(headersFrom({ 'x-request-id': long }));
    expect(id.length).toBe(128);
  });

  it('generates UUID when headers absent', () => {
    const id = getQuoteSendRequestId(headersFrom({}));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe('quoteSendJsonResponse', () => {
  it('sets X-Request-ID, Cache-Control, and optional Retry-After', () => {
    const res = quoteSendJsonResponse('trace-xyz', { ok: true }, 201);
    expect(res.headers.get('X-Request-ID')).toBe('trace-xyz');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const limited = quoteSendJsonResponse('rid', { ok: false }, 429, {
      'Retry-After': '42',
    });
    expect(limited.headers.get('Retry-After')).toBe('42');
  });
});

describe('supabaseErrorForLogs', () => {
  it('always includes supabaseCode when present', () => {
    expect(supabaseErrorForLogs({ code: '23505' })).toEqual({
      supabaseCode: '23505',
    });
  });

  it('truncates dev message when not in production', () => {
    if (process.env.NODE_ENV === 'production') return;
    const out = supabaseErrorForLogs({
      code: '42P01',
      message: 'x'.repeat(300),
    });
    expect(out.supabaseCode).toBe('42P01');
    expect(String(out.supabaseMessageDev).length).toBeLessThanOrEqual(200);
  });
});

describe('shortUserIdForLog', () => {
  it('returns first 8 characters', () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    expect(shortUserIdForLog(id)).toBe('aaaaaaaa');
  });
});

describe('truncateLogDetail', () => {
  it('truncates long strings', () => {
    const long = 'x'.repeat(100);
    expect(truncateLogDetail(long, 20)).toMatch(/^x{20}…$/);
  });
});

describe('maskEmailForLog', () => {
  it('masks local part and keeps domain', () => {
    expect(maskEmailForLog('jane@example.com')).toBe('j***e@example.com');
  });

  it('handles short local part', () => {
    expect(maskEmailForLog('a@b.co')).toBe('*@b.co');
  });

  it('returns placeholder for invalid input', () => {
    expect(maskEmailForLog('not-an-email')).toBe('[invalid]');
    expect(maskEmailForLog('@')).toBe('[invalid]');
  });
});
