import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import { describe, expect, it } from 'vitest';

describe('tapToPayRouteLog', () => {
  it('prefers X-Request-ID from the request', () => {
    const id = getTapToPayRequestId({
      headers: new Headers({ 'x-request-id': 'warmup-req-1' }),
    });
    expect(id).toBe('warmup-req-1');
  });

  it('echoes X-Request-ID on JSON responses', () => {
    const res = tapToPayJsonResponse('warmup-req-1', { success: true }, 200);
    expect(res.headers.get('X-Request-ID')).toBe('warmup-req-1');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
