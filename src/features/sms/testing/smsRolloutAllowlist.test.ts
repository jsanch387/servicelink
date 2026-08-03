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

  it('is active while the allowlist has emails', () => {
    expect(SMS_ROLLOUT_OWNER_EMAILS.length).toBeGreaterThan(0);
    expect(isSmsRolloutAllowlistActive()).toBe(true);
  });

  it('allows the rollout owner email case-insensitively', () => {
    expect(isOwnerEmailAllowedForSmsRollout('jesuss387@gmail.com')).toBe(true);
    expect(isOwnerEmailAllowedForSmsRollout('Jesuss387@Gmail.com')).toBe(true);
  });

  it('rejects other owners while the allowlist is active', () => {
    expect(isOwnerEmailAllowedForSmsRollout('other@example.com')).toBe(false);
    expect(isOwnerEmailAllowedForSmsRollout(null)).toBe(false);
    expect(isOwnerEmailAllowedForSmsRollout('')).toBe(false);
  });
});
