import { describe, expect, it } from 'vitest';
import {
  createGoogleConnectState,
  verifyGoogleConnectState,
} from '../server/googleConnectState';

const secret = 'test-google-connect-secret';

describe('googleConnectState', () => {
  it('round-trips a signed state with the matching nonce', () => {
    const now = 1_700_000_000_000;
    const created = createGoogleConnectState({
      businessId: 'biz-1',
      userId: 'user-1',
      secret,
      now,
    });

    const verified = verifyGoogleConnectState({
      state: created.state,
      nonce: created.nonce,
      secret,
      now,
    });

    expect(verified).toEqual({
      ok: true,
      value: { businessId: 'biz-1', userId: 'user-1' },
    });
  });

  it('rejects a wrong nonce or expired state', () => {
    const now = 1_700_000_000_000;
    const created = createGoogleConnectState({
      businessId: 'biz-1',
      userId: 'user-1',
      secret,
      now,
    });

    expect(
      verifyGoogleConnectState({
        state: created.state,
        nonce: 'not-the-nonce',
        secret,
        now,
      })
    ).toEqual({ ok: false });

    expect(
      verifyGoogleConnectState({
        state: created.state,
        nonce: created.nonce,
        secret,
        now: now + 11 * 60 * 1000,
      })
    ).toEqual({ ok: false });
  });
});
