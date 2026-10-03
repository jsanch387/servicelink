import { describe, expect, it } from 'vitest';
import {
  INVOICES_ROLLOUT_OPEN_TO_ALL,
  isOwnerEmailAllowedForInvoicesRollout,
} from '../config/invoicesRolloutAllowlist';

describe('invoicesRolloutAllowlist', () => {
  it('is open to every account', () => {
    expect(INVOICES_ROLLOUT_OPEN_TO_ALL).toBe(true);
  });

  it('allows any account email while open to all', () => {
    expect(isOwnerEmailAllowedForInvoicesRollout('any-owner@example.com')).toBe(
      true
    );
    expect(
      isOwnerEmailAllowedForInvoicesRollout('  JesusS387@gmail.com  ')
    ).toBe(true);
    expect(isOwnerEmailAllowedForInvoicesRollout(null)).toBe(true);
  });
});
