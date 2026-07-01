import { describe, expect, it } from 'vitest';

import {
  formatFullShopAddress,
  formatProfileLocationLabel,
  validateBusinessLocation,
} from '../utils/businessLocation';

describe('validateBusinessLocation', () => {
  it('requires city, state, and zip', () => {
    expect(validateBusinessLocation({ city: '', state: '', zip: '' })).toEqual(
      expect.arrayContaining(['City and state are required', 'ZIP is required'])
    );
  });

  it('requires zip when city and state are set', () => {
    expect(
      validateBusinessLocation({ city: 'Austin', state: 'TX', zip: '' })
    ).toContain('ZIP is required');
  });

  it('accepts complete location', () => {
    expect(
      validateBusinessLocation({ city: 'Austin', state: 'TX', zip: '78701' })
    ).toEqual([]);
  });
});

describe('formatProfileLocationLabel', () => {
  it('formats city state zip', () => {
    expect(formatProfileLocationLabel('Austin', 'TX', '78701')).toBe(
      'Austin, TX 78701'
    );
  });
});

describe('formatFullShopAddress', () => {
  it('formats street, unit, city, state, zip', () => {
    expect(
      formatFullShopAddress({
        street: '123 Main St',
        unit: 'Suite 4',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      })
    ).toBe('123 Main St, Suite 4, Austin, TX 78701');
  });

  it('returns null when empty', () => {
    expect(
      formatFullShopAddress({
        street: '',
        city: '',
        state: '',
        zip: '',
      })
    ).toBeNull();
  });
});
