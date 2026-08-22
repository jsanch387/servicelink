import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AFFONSO_SIGNUP_TRACKED_KEY,
  trackAffonsoSignupOnce,
} from '../utils/affonsoSignupTracking';

describe('trackAffonsoSignupOnce', () => {
  afterEach(() => {
    localStorage.clear();
    delete window.Affonso;
    vi.useRealTimers();
  });

  it('calls Affonso.signup with email and marks tracked', async () => {
    const signup = vi.fn();
    window.Affonso = { signup };

    await trackAffonsoSignupOnce({ email: 'jane@example.com' });

    expect(signup).toHaveBeenCalledWith('jane@example.com');
    expect(localStorage.getItem(AFFONSO_SIGNUP_TRACKED_KEY)).toBe('1');
  });

  it('passes the object form when user id is present', async () => {
    const signup = vi.fn();
    window.Affonso = { signup };

    await trackAffonsoSignupOnce({
      email: 'jane@example.com',
      externalUserId: 'user-1',
    });

    expect(signup).toHaveBeenCalledWith({
      email: 'jane@example.com',
      externalUserId: 'user-1',
    });
  });

  it('does not call again after a successful track', async () => {
    const signup = vi.fn();
    window.Affonso = { signup };

    await trackAffonsoSignupOnce({ email: 'jane@example.com' });
    await trackAffonsoSignupOnce({ email: 'jane@example.com' });

    expect(signup).toHaveBeenCalledOnce();
  });

  it('skips when there is no email or user id', async () => {
    const signup = vi.fn();
    window.Affonso = { signup };

    await trackAffonsoSignupOnce({});

    expect(signup).not.toHaveBeenCalled();
    expect(localStorage.getItem(AFFONSO_SIGNUP_TRACKED_KEY)).toBeNull();
  });
});
