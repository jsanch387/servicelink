import { describe, expect, it } from 'vitest';

import {
  parseEditProfileTab,
  tabForSaveErrors,
} from '../utils/editProfileTab';

describe('parseEditProfileTab', () => {
  it('accepts edit tabs and ignores unknown values', () => {
    expect(parseEditProfileTab('booking')).toBe('booking');
    expect(parseEditProfileTab('details')).toBe('details');
    expect(parseEditProfileTab('gallery')).toBeUndefined();
    expect(parseEditProfileTab(undefined)).toBeUndefined();
  });
});

describe('tabForSaveErrors', () => {
  it('routes gallery errors to photos', () => {
    expect(tabForSaveErrors(['Failed to upload gallery images'])).toBe(
      'photos'
    );
  });

  it('routes phone errors to contact', () => {
    expect(tabForSaveErrors(['Phone number must be 10 digits'])).toBe(
      'contact'
    );
  });

  it('routes shop errors to booking', () => {
    expect(tabForSaveErrors(['Choose a suggested shop address'])).toBe(
      'booking'
    );
  });

  it('routes policy errors to booking', () => {
    expect(tabForSaveErrors(['Add your customer policy or turn it off.'])).toBe(
      'booking'
    );
  });

  it('routes location errors to details when not shop-specific', () => {
    expect(tabForSaveErrors(['City and state are required'])).toBe('details');
  });

  it('prefers booking when shop and location errors are combined', () => {
    expect(
      tabForSaveErrors([
        'ZIP is required',
        'Choose a suggested shop address',
      ])
    ).toBe('booking');
  });
});
