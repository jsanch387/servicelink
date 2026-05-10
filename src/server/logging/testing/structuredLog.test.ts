import { describe, expect, it, vi } from 'vitest';
import { structuredLog, supabaseErrorForLogs } from '../structuredLog';

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

describe('structuredLog', () => {
  it('writes JSON payload with scope and requestId', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    structuredLog('test-scope', 'rid-1', 'info', 'hello', { a: 1 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const [line, payload] = infoSpy.mock.calls[0] as [string, string];
    expect(line).toContain('test-scope');
    expect(line).toContain('hello');
    expect(JSON.parse(payload)).toMatchObject({
      scope: 'test-scope',
      requestId: 'rid-1',
      event: 'hello',
      a: 1,
    });

    infoSpy.mockRestore();
  });
});
