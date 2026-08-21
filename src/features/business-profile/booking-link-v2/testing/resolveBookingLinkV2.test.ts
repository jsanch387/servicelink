import { describe, expect, it } from 'vitest';
import { isBookingLinkV2Enabled } from '../config/isBookingLinkV2Enabled';
import {
  parseBookingLinkV2QueryOverride,
  resolveShouldUseBookingLinkV2,
} from '../utils/resolveBookingLinkV2';

describe('resolveBookingLinkV2', () => {
  it('parses query overrides', () => {
    expect(parseBookingLinkV2QueryOverride('1')).toBe(true);
    expect(parseBookingLinkV2QueryOverride('true')).toBe(true);
    expect(parseBookingLinkV2QueryOverride('0')).toBe(false);
    expect(parseBookingLinkV2QueryOverride('false')).toBe(false);
    expect(parseBookingLinkV2QueryOverride('')).toBeNull();
    expect(parseBookingLinkV2QueryOverride(undefined)).toBeNull();
  });

  it('uses rollout when the master switch is on and there is no override', () => {
    expect(isBookingLinkV2Enabled()).toBe(true);
    expect(resolveShouldUseBookingLinkV2({ inRollout: true })).toBe(true);
    expect(resolveShouldUseBookingLinkV2({ inRollout: false })).toBe(false);
  });

  it('lets ?v2=1 preview 2.0 even when not in rollout', () => {
    expect(
      resolveShouldUseBookingLinkV2({
        inRollout: false,
        queryOverride: '1',
      })
    ).toBe(true);
  });

  it('lets ?v2=0 force the current booking link', () => {
    expect(
      resolveShouldUseBookingLinkV2({
        inRollout: true,
        queryOverride: '0',
      })
    ).toBe(false);
  });
});
