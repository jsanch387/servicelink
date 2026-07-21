import { describe, expect, it } from 'vitest';

import {
  normalizeSocialInput,
  parseSocialMedia,
  socialLinksForDisplay,
  socialMediaForPersist,
  socialProfileUrl,
} from '../utils/socialMedia';

describe('socialMedia', () => {
  it('normalizes handles and profile URLs', () => {
    expect(normalizeSocialInput('instagram', '@Mike.Details')).toBe(
      'Mike.Details'
    );
    expect(
      normalizeSocialInput(
        'instagram',
        'https://www.instagram.com/mike.details/'
      )
    ).toBe('mike.details');
    expect(
      normalizeSocialInput('tiktok', 'https://www.tiktok.com/@shine.crew')
    ).toBe('shine.crew');
    expect(normalizeSocialInput('instagram', 'not a handle!!')).toBe('');
  });

  it('builds canonical profile URLs', () => {
    expect(socialProfileUrl('instagram', '@mike')).toBe(
      'https://instagram.com/mike'
    );
    expect(socialProfileUrl('tiktok', 'mike')).toBe(
      'https://www.tiktok.com/@mike'
    );
  });

  it('persists only filled platforms', () => {
    expect(
      socialMediaForPersist({
        instagram: '@mike',
        tiktok: '',
      })
    ).toEqual({ instagram: 'mike' });
  });

  it('parses stored json for display links', () => {
    expect(parseSocialMedia({ instagram: 'mike', tiktok: 'mike' })).toEqual({
      instagram: 'mike',
      tiktok: 'mike',
    });
    expect(socialLinksForDisplay({ instagram: 'mike' })).toEqual([
      {
        id: 'instagram',
        label: 'Instagram',
        href: 'https://instagram.com/mike',
      },
    ]);
  });
});
