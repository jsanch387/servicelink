import {
  buildReviewInviteTrace,
  getReviewInviteRequestId,
  logReviewInviteFinished,
  maskEmailForLog,
  reviewInviteJsonResponse,
  supabaseErrorForLogs,
  truncateLogDetail,
} from '../server/reviewInviteRouteLog';
import { afterEach, describe, expect, it, vi } from 'vitest';

function headersFrom(
  entries: Record<string, string>
): Pick<Request, 'headers'> {
  return { headers: new Headers(entries) };
}

describe('getReviewInviteRequestId', () => {
  it('prefers X-Request-ID', () => {
    const id = getReviewInviteRequestId(
      headersFrom({
        'x-request-id': 'mobile-req-1',
        'x-correlation-id': 'corr-other',
      })
    );
    expect(id).toBe('mobile-req-1');
  });

  it('generates UUID when headers absent', () => {
    const id = getReviewInviteRequestId(headersFrom({}));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe('reviewInviteJsonResponse', () => {
  it('sets X-Request-ID and Cache-Control', () => {
    const res = reviewInviteJsonResponse('trace-abc', { success: true }, 200);
    expect(res.headers.get('X-Request-ID')).toBe('trace-abc');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('buildReviewInviteTrace', () => {
  it('prefixes entity ids', () => {
    const trace = buildReviewInviteTrace('req-1', 'mobile_api', {
      businessId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      bookingId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    expect(trace.businessIdPrefix).toBe('bbbbbbbb');
    expect(trace.bookingIdPrefix).toBe('aaaaaaaa');
  });
});

describe('maskEmailForLog', () => {
  it('masks local part', () => {
    expect(maskEmailForLog('jane@example.com')).toBe('j***e@example.com');
  });
});

describe('logReviewInviteFinished', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits one transactional line for sent', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const trace = buildReviewInviteTrace('req-mobile-99', 'mobile_api', {
      businessId: 'biz-12345678-abcd',
      bookingId: 'book-87654321-wxyz',
    });

    logReviewInviteFinished(trace, {
      kind: 'sent',
      inviteId: 'inv-abcdef12-3456-7890-abcd-ef1234567890',
    });

    expect(info).toHaveBeenCalledOnce();
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain('[review-invite] finished');
    expect(line).toContain('outcome=sent');
    expect(line).toContain('req=req-mobile-99');
    expect(line).not.toContain('biz-12345678');
  });

  it('logs skipped at info level', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const trace = buildReviewInviteTrace('req-1', 'web_patch', {
      bookingId: 'booking-1',
    });

    logReviewInviteFinished(trace, {
      kind: 'skipped',
      reason: 'customer_already_reviewed',
    });

    expect(info).toHaveBeenCalledOnce();
    expect(String(info.mock.calls[0]?.[0])).toContain('outcome=skipped');
    expect(String(info.mock.calls[0]?.[0])).toContain(
      'reason=customer_already_reviewed'
    );
  });

  it('logs rejected at warn level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logReviewInviteFinished(buildReviewInviteTrace('req-1', 'mobile_api'), {
      kind: 'rejected',
      httpStatus: 404,
      error: 'Booking not found',
    });
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('supabaseErrorForLogs', () => {
  it('includes supabaseCode', () => {
    expect(supabaseErrorForLogs({ code: '23505' })).toEqual({
      supabaseCode: '23505',
    });
  });
});

describe('truncateLogDetail', () => {
  it('truncates long strings', () => {
    expect(truncateLogDetail('x'.repeat(100), 80).length).toBe(81);
  });
});
