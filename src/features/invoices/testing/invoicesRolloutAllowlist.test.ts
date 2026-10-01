import { describe, expect, it } from 'vitest';
import { isOwnerEmailAllowedForInvoicesRollout } from '../config/invoicesRolloutAllowlist';

describe('invoicesRolloutAllowlist', () => {
  it('allows only the rollout account', () => {
    expect(isOwnerEmailAllowedForInvoicesRollout('jesuss387@gmail.com')).toBe(
      true
    );
    expect(
      isOwnerEmailAllowedForInvoicesRollout('  JesusS387@gmail.com  ')
    ).toBe(true);
    expect(isOwnerEmailAllowedForInvoicesRollout('other@shop.com')).toBe(
      false
    );
    expect(isOwnerEmailAllowedForInvoicesRollout(null)).toBe(false);
  });
});
