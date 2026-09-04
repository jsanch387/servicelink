import { describe, expect, it } from 'vitest';
import {
  generatePublicProfileShareDescription,
  generatePublicProfileShareTitle,
} from '../utils/publicProfileShareCopy';

describe('public profile share copy', () => {
  it('keeps the shop name and drops product branding', () => {
    expect(
      generatePublicProfileShareTitle({
        businessName: 'Black Label Detailing',
        tradeLine: 'Auto detailing',
        serviceArea: 'Austin, Texas',
      })
    ).toBe('Black Label Detailing · Auto detailing in Austin, Texas');
  });

  it('joins two jobs and falls back without a fake industry', () => {
    expect(
      generatePublicProfileShareTitle({
        businessName: 'Black Label Detailing',
        tradeLine: 'Auto detailing and window tinting',
        serviceArea: 'Austin, Texas',
      })
    ).toBe(
      'Black Label Detailing · Auto detailing and window tinting in Austin, Texas'
    );
    expect(
      generatePublicProfileShareTitle({
        businessName: 'Black Label Detailing',
        tradeLine: '',
        serviceArea: 'Austin, Texas',
      })
    ).toBe('Black Label Detailing · Austin, Texas');
  });

  it('prefers bio, then trade line plus city', () => {
    expect(
      generatePublicProfileShareDescription({
        bio: 'Mobile detailing for Austin.',
        businessName: 'Black Label Detailing',
        tradeLine: 'Auto detailing',
        serviceArea: 'Austin, Texas',
      })
    ).toBe('Mobile detailing for Austin.');
    expect(
      generatePublicProfileShareDescription({
        bio: '',
        businessName: 'Black Label Detailing',
        tradeLine: 'Auto detailing',
        serviceArea: 'Austin, Texas',
      })
    ).toBe('Auto detailing in Austin, Texas');
  });
});
