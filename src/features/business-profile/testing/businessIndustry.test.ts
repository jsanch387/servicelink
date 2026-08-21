import { describe, expect, it } from 'vitest';
import {
  BUSINESS_TYPE_OPTIONS,
  PET_ASSET_FIELDS,
  VEHICLE_ASSET_FIELDS,
  canonicalizeBusinessType,
  getBusinessTypeSelectOptions,
  getIndustryOnboardingCopy,
  isAllowedBusinessTypeValue,
  isPetRelatedBusinessType,
  isVehicleRelatedBusinessType,
  resolveBusinessIndustry,
} from '@/constants/businessTypes';

describe('business industry context', () => {
  it('offers only types we can serve on new signup', () => {
    expect(BUSINESS_TYPE_OPTIONS.map(option => option.value)).toEqual([
      'Auto & Detailing',
      'Window Tinting',
      'Mobile Repair',
      'Pet Grooming',
      'Pressure Washing',
    ]);
  });

  it('does not offer beauty, cleaning, or other on signup', () => {
    const values = BUSINESS_TYPE_OPTIONS.map(option => option.value);
    expect(values).not.toContain('Beauty');
    expect(values).not.toContain('Cleaning Services');
    expect(values).not.toContain('Other');
    expect(values).not.toContain('Lawn Care & Landscaping');
  });

  it('treats detailing, tint, and repair as the same vehicle template', () => {
    for (const type of [
      'Auto & Detailing',
      'Window Tinting',
      'Mobile Repair',
      'mobile repair',
      'Mobile Detailing',
    ]) {
      const industry = resolveBusinessIndustry(type);
      expect(industry.template).toBe('vehicle');
      expect(industry.showVehicleFields).toBe(true);
      expect(industry.showPetFields).toBe(false);
      expect(isVehicleRelatedBusinessType(type)).toBe(true);
    }
  });

  it('maps pet grooming to the pet template and onboarding copy', () => {
    const industry = resolveBusinessIndustry('Pet Grooming');
    expect(industry.template).toBe('pet');
    expect(industry.assetKind).toBe('pet');
    expect(industry.assetFields).toEqual(PET_ASSET_FIELDS);
    expect(industry.showPetFields).toBe(true);
    expect(industry.showVehicleFields).toBe(false);
    expect(isPetRelatedBusinessType('Pet Grooming')).toBe(true);
    expect(isVehicleRelatedBusinessType('Pet Grooming')).toBe(false);
    expect(getIndustryOnboardingCopy('Pet Grooming').firstService.name).toBe(
      'Full Groom'
    );
    expect(
      getIndustryOnboardingCopy('Pet Grooming').businessNamePlaceholder
    ).toContain('Paws');
  });

  it('attaches the same vehicle fields to detailing, tint, and repair', () => {
    const detailing = resolveBusinessIndustry('Auto & Detailing');
    expect(detailing.assetKind).toBe('vehicle');
    expect(detailing.assetFields).toEqual(VEHICLE_ASSET_FIELDS);
    expect(resolveBusinessIndustry('Window Tinting').assetFields).toEqual(
      VEHICLE_ASSET_FIELDS
    );
  });

  it('leaves property types ready for extra fields later', () => {
    const pressure = resolveBusinessIndustry('Pressure Washing');
    expect(pressure.assetKind).toBe('property');
    expect(pressure.assetFields).toEqual([]);
  });

  it('keeps hidden legacy types resolvable without vehicle fields', () => {
    expect(resolveBusinessIndustry('Beauty').template).toBe('person');
    expect(resolveBusinessIndustry('Cleaning Services').template).toBe(
      'property'
    );
    expect(isVehicleRelatedBusinessType('Beauty')).toBe(false);
    expect(isAllowedBusinessTypeValue('Beauty')).toBe(true);
  });

  it('canonicalizes drifted casing and aliases', () => {
    expect(canonicalizeBusinessType('mobile repair')).toBe('Mobile Repair');
    expect(canonicalizeBusinessType('Pressure washing')).toBe(
      'Pressure Washing'
    );
    expect(canonicalizeBusinessType('Automotive')).toBe('Auto & Detailing');
  });

  it('falls back to a person template for unknown types', () => {
    const industry = resolveBusinessIndustry('Technology');
    expect(industry.template).toBe('person');
    expect(industry.showVehicleFields).toBe(false);
    expect(industry.value).toBeNull();
  });

  it('keeps a legacy stored type visible in settings', () => {
    const options = getBusinessTypeSelectOptions('Beauty');
    expect(options[0]).toEqual({ value: 'Beauty', label: 'Beauty' });
    expect(options.some(option => option.value === 'Pet Grooming')).toBe(true);
  });
});
