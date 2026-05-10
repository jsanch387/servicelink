import { getPublicBookingRequestId } from '@/features/availability/server/publicBookingRouteLog';
import { describe, expect, it } from 'vitest';

function headersFrom(
  entries: Record<string, string>
): Pick<Request, 'headers'> {
  return { headers: new Headers(entries) };
}

describe('getPublicBookingRequestId', () => {
  it('prefers X-Request-ID', () => {
    expect(
      getPublicBookingRequestId(
        headersFrom({
          'x-request-id': 'req-from-client',
          'x-correlation-id': 'corr-other',
        })
      )
    ).toBe('req-from-client');
  });

  it('falls back to X-Correlation-ID', () => {
    expect(
      getPublicBookingRequestId(headersFrom({ 'x-correlation-id': 'corr-abc' }))
    ).toBe('corr-abc');
  });

  it('caps header length', () => {
    const long = 'x'.repeat(200);
    expect(
      getPublicBookingRequestId(headersFrom({ 'x-request-id': long }))
    ).toHaveLength(128);
  });

  it('generates UUID when headers absent', () => {
    const id = getPublicBookingRequestId(headersFrom({}));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
