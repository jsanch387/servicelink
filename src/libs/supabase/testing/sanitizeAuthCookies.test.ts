import { describe, expect, it } from 'vitest';
import { sanitizeSupabaseAuthCookies } from '../sanitizeAuthCookies';

const KEY = 'sb-exampleproj-auth-token';

const sessionJson = JSON.stringify({
  access_token: 'aaa',
  refresh_token: 'bbb',
  user: { id: 'user-1' },
});

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

describe('sanitizeSupabaseAuthCookies', () => {
  it('keeps raw JSON session cookies', () => {
    const { cookies, staleNames } = sanitizeSupabaseAuthCookies([
      { name: KEY, value: sessionJson },
    ]);
    expect(staleNames).toEqual([]);
    expect(cookies).toEqual([{ name: KEY, value: sessionJson }]);
  });

  it('keeps legacy base64url session cookies', () => {
    const value = `base64-${toBase64Url(sessionJson)}`;
    const { cookies, staleNames } = sanitizeSupabaseAuthCookies([
      { name: KEY, value },
    ]);
    expect(staleNames).toEqual([]);
    expect(cookies).toEqual([{ name: KEY, value }]);
  });

  it('drops mixed base64 + raw JWT chunks that would throw in @supabase/ssr', () => {
    const { cookies, staleNames } = sanitizeSupabaseAuthCookies([
      { name: `${KEY}.0`, value: `base64-${toBase64Url('{"access_token":"')}` },
      {
        name: `${KEY}.1`,
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig"}',
      },
    ]);
    expect(staleNames).toEqual([`${KEY}.0`, `${KEY}.1`]);
    expect(cookies).toEqual([]);
  });

  it('does not treat code-verifier cookies as session chunks', () => {
    const verifier = { name: `${KEY}-code-verifier`, value: 'abc.def' };
    const { cookies, staleNames } = sanitizeSupabaseAuthCookies([verifier]);
    expect(staleNames).toEqual([]);
    expect(cookies).toEqual([verifier]);
  });
});
