import { describe, expect, it } from 'vitest';

import {
  assertFreeTierReplaceAllServiceCount,
  maxServiceCountAllowedOnFreeTier,
} from '../server/freeTierServiceLimit';

describe('freeTierServiceLimit', () => {
  it('maxServiceCountAllowedOnFreeTier is at least FREE_MAX_SERVICES', () => {
    expect(maxServiceCountAllowedOnFreeTier(0)).toBe(5);
    expect(maxServiceCountAllowedOnFreeTier(3)).toBe(5);
    expect(maxServiceCountAllowedOnFreeTier(7)).toBe(7);
    expect(maxServiceCountAllowedOnFreeTier(12)).toBe(12);
  });

  it('replace-all allows Pro without cap', () => {
    expect(assertFreeTierReplaceAllServiceCount(2, 99, true)).toEqual({
      ok: true,
    });
  });

  it('replace-all blocks Free when growing past default cap from small baseline', () => {
    const r = assertFreeTierReplaceAllServiceCount(0, 6, false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5 services/i);
  });

  it('replace-all allows Free to reach cap from zero', () => {
    expect(assertFreeTierReplaceAllServiceCount(0, 5, false)).toEqual({
      ok: true,
    });
  });

  it('grandfather: Free may keep or trim but not grow past existing over cap', () => {
    expect(assertFreeTierReplaceAllServiceCount(8, 8, false)).toEqual({
      ok: true,
    });
    expect(assertFreeTierReplaceAllServiceCount(8, 7, false)).toEqual({
      ok: true,
    });
    const r = assertFreeTierReplaceAllServiceCount(8, 9, false);
    expect(r.ok).toBe(false);
  });
});
