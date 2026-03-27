import { hasProCheckInAccessFromTier } from '@/features/customer-management/utils/proCheckInAccess';
import { describe, expect, it } from 'vitest';

describe('hasProCheckInAccessFromTier', () => {
  it('returns true only when tier is exactly pro', () => {
    expect(hasProCheckInAccessFromTier('pro')).toBe(true);
  });

  it('returns false for free and unknown tiers', () => {
    expect(hasProCheckInAccessFromTier('free')).toBe(false);
    expect(hasProCheckInAccessFromTier('enterprise')).toBe(false);
    expect(hasProCheckInAccessFromTier('')).toBe(false);
  });

  it('returns false for null/undefined (treat as non-Pro)', () => {
    expect(hasProCheckInAccessFromTier(null)).toBe(false);
    expect(hasProCheckInAccessFromTier(undefined)).toBe(false);
  });

  it('does not trim — only exact "pro" (avoids accidental typos in DB)', () => {
    expect(hasProCheckInAccessFromTier(' pro')).toBe(false);
    expect(hasProCheckInAccessFromTier('pro ')).toBe(false);
  });
});
