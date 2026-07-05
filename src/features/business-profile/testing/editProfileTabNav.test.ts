import { describe, expect, it } from 'vitest';

import { tabForSaveErrors } from '../components/edit/EditProfileTabNav';

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
    expect(tabForSaveErrors(['Shop street address is required'])).toBe(
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
        'Shop address requires city, state, and ZIP',
      ])
    ).toBe('booking');
  });
});
