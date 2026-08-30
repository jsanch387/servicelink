import { describe, expect, it } from 'vitest';
import {
  deriveSpecialtiesFromBusinessType,
  getSpecialtiesForBusinessType,
  hasDetailingMarketplaceListing,
  resolveBusinessSpecialties,
  sanitizeBusinessSpecialties,
  specialtiesAllowedForBusinessType,
} from '@/constants/businessSpecialties';

describe('business specialties', () => {
  it('offers a short vehicle list plus Other', () => {
    expect(
      getSpecialtiesForBusinessType('Vehicle Services').map(item => item.slug)
    ).toEqual([
      'detailing',
      'window_tinting',
      'auto_glass',
      'mobile_repair',
      'other',
    ]);
  });

  it('derives detailing for legacy auto shops', () => {
    expect(deriveSpecialtiesFromBusinessType('Auto & Detailing')).toEqual([
      'detailing',
    ]);
    expect(deriveSpecialtiesFromBusinessType('Mobile Detailing')).toEqual([
      'detailing',
    ]);
  });

  it('does not imply a marketplace tag for new job buckets', () => {
    expect(deriveSpecialtiesFromBusinessType('Vehicle Services')).toEqual([]);
    expect(deriveSpecialtiesFromBusinessType('Pet Services')).toEqual([]);
  });

  it('prefers saved specialties over the legacy type', () => {
    expect(
      resolveBusinessSpecialties('Auto & Detailing', ['window_tinting'])
    ).toEqual(['window_tinting']);
    expect(resolveBusinessSpecialties('Auto & Detailing', null)).toEqual([
      'detailing',
    ]);
  });

  it('keeps legacy detailers on Find detailers', () => {
    expect(hasDetailingMarketplaceListing('Auto & Detailing', null)).toBe(true);
    expect(
      hasDetailingMarketplaceListing('Vehicle Services', ['detailing'])
    ).toBe(true);
    expect(
      hasDetailingMarketplaceListing('Vehicle Services', ['window_tinting'])
    ).toBe(false);
  });

  it('drops niches that do not belong to the new industry', () => {
    expect(
      specialtiesAllowedForBusinessType('Pet Services', [
        'detailing',
        'pet_grooming',
      ])
    ).toEqual(['pet_grooming']);
    expect(specialtiesAllowedForBusinessType('Other', ['detailing'])).toEqual([
      'other',
    ]);
  });

  it('drops unknown specialty slugs', () => {
    expect(
      sanitizeBusinessSpecialties(['detailing', 'not-a-real-tag', 'detailing'])
    ).toEqual(['detailing']);
  });
});
