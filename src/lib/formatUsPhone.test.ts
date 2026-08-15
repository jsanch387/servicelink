import { describe, expect, it } from 'vitest';
import {
  formatUsPhoneDigits,
  formatUsPhoneWithCountry,
  normalizeUsPhoneDigits,
  usPhoneTelHref,
} from './formatUsPhone';

describe('normalizeUsPhoneDigits', () => {
  it('strips a leading country-code 1 from 11-digit numbers', () => {
    expect(normalizeUsPhoneDigits('15807545207')).toBe('5807545207');
    expect(normalizeUsPhoneDigits('1 (580) 754-5207')).toBe('5807545207');
  });

  it('keeps 10-digit national numbers', () => {
    expect(normalizeUsPhoneDigits('5807545207')).toBe('5807545207');
  });
});

describe('formatUsPhoneWithCountry', () => {
  it('always shows +1 for complete US numbers', () => {
    expect(formatUsPhoneWithCountry('5807545207')).toBe('+1 (580) 754-5207');
    expect(formatUsPhoneWithCountry('(580) 754-5207')).toBe(
      '+1 (580) 754-5207'
    );
  });

  it('does not treat the country code as an area code', () => {
    expect(formatUsPhoneWithCountry('15807545207')).toBe('+1 (580) 754-5207');
    expect(formatUsPhoneWithCountry('+15807545207')).toBe('+1 (580) 754-5207');
  });
});

describe('formatUsPhoneDigits', () => {
  it('formats national digits without a country prefix (for inputs)', () => {
    expect(formatUsPhoneDigits('5807545207')).toBe('(580) 754-5207');
  });
});

describe('usPhoneTelHref', () => {
  it('returns E.164 tel links', () => {
    expect(usPhoneTelHref('5807545207')).toBe('tel:+15807545207');
    expect(usPhoneTelHref('15807545207')).toBe('tel:+15807545207');
  });

  it('returns null when the number is not a complete US phone', () => {
    expect(usPhoneTelHref('580')).toBeNull();
    expect(usPhoneTelHref('')).toBeNull();
  });
});
