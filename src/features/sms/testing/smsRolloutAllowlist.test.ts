import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isOwnerEmailAllowedForSmsRollout,
  isSmsRolloutAllowlistActive,
  SMS_ROLLOUT_OWNER_EMAILS,
} from '../config/smsRolloutAllowlist';

describe('smsRolloutAllowlist', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is inactive when the allowlist is empty (open to all Pro)', () => {
    expect(SMS_ROLLOUT_OWNER_EMAILS).toEqual([]);
    expect(isSmsRolloutAllowlistActive()).toBe(false);
  });

  it('allows any owner email while the allowlist is inactive', () => {
    expect(isOwnerEmailAllowedForSmsRollout('anyone@example.com')).toBe(true);
    expect(isOwnerEmailAllowedForSmsRollout(null)).toBe(true);
    expect(isOwnerEmailAllowedForSmsRollout('')).toBe(true);
  });
});
