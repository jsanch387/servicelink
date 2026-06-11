import { toE164 } from '@/features/sms/utils/toE164';
import { describe, expect, it } from 'vitest';

describe('toE164', () => {
  it('returns null for empty / missing input', () => {
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164('')).toBeNull();
    expect(toE164('   ')).toBeNull();
  });

  it('normalizes a 10-digit US number to +1', () => {
    expect(toE164('5807545207')).toBe('+15807545207');
  });

  it('normalizes common formatting (spaces, dashes, parens, dots)', () => {
    expect(toE164('(580) 754-5207')).toBe('+15807545207');
    expect(toE164('580.754.5207')).toBe('+15807545207');
    expect(toE164(' 580 754 5207 ')).toBe('+15807545207');
  });

  it('normalizes 11-digit numbers starting with country code 1', () => {
    expect(toE164('15807545207')).toBe('+15807545207');
    expect(toE164('1 (580) 754-5207')).toBe('+15807545207');
  });

  it('keeps already-valid E.164 numbers', () => {
    expect(toE164('+15807545207')).toBe('+15807545207');
    expect(toE164('+447911123456')).toBe('+447911123456');
  });

  it('rejects ambiguous / invalid lengths (no silent bad sends)', () => {
    expect(toE164('12345')).toBeNull(); // too short
    expect(toE164('555123')).toBeNull();
    expect(toE164('25807545207')).toBeNull(); // 11 digits not starting with 1
    expect(toE164('abcdefghij')).toBeNull();
    expect(toE164('+1')).toBeNull(); // too few digits after +
  });
});
