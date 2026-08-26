import { afterEach, describe, expect, it } from 'vitest';
import { getAffonsoReferralId } from '../utils/affonsoReferral';

describe('getAffonsoReferralId', () => {
  afterEach(() => {
    delete window.affonso_referral;
    document.cookie = 'affonso_referral=; max-age=0; path=/';
  });

  it('prefers window.affonso_referral', () => {
    document.cookie = 'affonso_referral=from_cookie';
    window.affonso_referral = 'from_window';
    expect(getAffonsoReferralId()).toBe('from_window');
  });

  it('falls back to the affonso_referral cookie', () => {
    document.cookie = 'affonso_referral=from_cookie';
    expect(getAffonsoReferralId()).toBe('from_cookie');
  });

  it('returns empty when neither is set', () => {
    expect(getAffonsoReferralId()).toBe('');
  });
});
