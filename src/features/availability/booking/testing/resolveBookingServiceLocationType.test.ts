import { describe, expect, it } from 'vitest';

import {
  clientServiceLocationChoice,
  resolvePersistedBookingServiceLocationType,
  validateServiceLocationTypeInput,
} from '../utils/resolveBookingServiceLocationType';

describe('clientServiceLocationChoice', () => {
  it('prefers serviceLocationType over customerServiceLocation', () => {
    expect(
      clientServiceLocationChoice({
        serviceLocationType: 'shop',
        customerServiceLocation: 'mobile',
      })
    ).toBe('shop');
  });

  it('falls back to customerServiceLocation', () => {
    expect(
      clientServiceLocationChoice({ customerServiceLocation: 'mobile' })
    ).toBe('mobile');
  });
});

describe('validateServiceLocationTypeInput', () => {
  it('rejects shop when business is mobile_only', () => {
    expect(validateServiceLocationTypeInput('shop', 'mobile_only').ok).toBe(
      false
    );
  });

  it('rejects mobile when business is shop_only', () => {
    expect(validateServiceLocationTypeInput('mobile', 'shop_only').ok).toBe(
      false
    );
  });

  it('accepts mobile or shop for both', () => {
    expect(validateServiceLocationTypeInput('mobile', 'both')).toEqual({
      ok: true,
      value: 'mobile',
    });
    expect(validateServiceLocationTypeInput('shop', 'both')).toEqual({
      ok: true,
      value: 'shop',
    });
  });
});

describe('resolvePersistedBookingServiceLocationType', () => {
  it('uses client choice when provided', () => {
    expect(
      resolvePersistedBookingServiceLocationType({
        clientChoice: 'shop',
        businessMode: 'both',
      })
    ).toBe('shop');
  });

  it('infers from unambiguous business mode when choice missing', () => {
    expect(
      resolvePersistedBookingServiceLocationType({
        businessMode: 'mobile_only',
      })
    ).toBe('mobile');
    expect(
      resolvePersistedBookingServiceLocationType({
        businessMode: 'shop_only',
      })
    ).toBe('shop');
  });

  it('returns null for both mode without choice', () => {
    expect(
      resolvePersistedBookingServiceLocationType({ businessMode: 'both' })
    ).toBeNull();
  });
});
