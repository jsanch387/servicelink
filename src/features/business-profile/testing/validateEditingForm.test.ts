import { describe, expect, it } from 'vitest';

import { validateEditingForm } from '../utils/editing/editingValidation';
import type { EditingFormData } from '../utils/editing/editingTypes';
import { DEFAULT_SERVICE_LOCATION_UI } from '../utils/serviceLocationMode';

const baseFormData: EditingFormData = {
  business_name: 'Test Detailing',
  business_type: 'Vehicle Services',
  specialties: ['detailing'],
  service_area: 'Austin, TX',
  business_zip: '78701',
  bio: '',
  phone_number_call: '',
  phone_number_text: '',
  same_phone_for_both: false,
  instagram: '',
  tiktok: '',
  images: [],
};

describe('validateEditingForm', () => {
  it('accepts a complete profile with mobile_only', () => {
    const result = validateEditingForm(
      baseFormData,
      DEFAULT_SERVICE_LOCATION_UI
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('requires business name and location', () => {
    const result = validateEditingForm(
      {
        ...baseFormData,
        business_name: '',
        service_area: '',
        business_zip: '',
      },
      DEFAULT_SERVICE_LOCATION_UI
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Business name is required',
        'City and state are required',
      ])
    );
  });

  it('requires full shop address when shop is offered', () => {
    const result = validateEditingForm(baseFormData, {
      mode: 'shop_only',
      shopAddress: {
        streetAddress: '',
        unitApt: '',
        city: '',
        state: '',
        zip: '',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Choose a suggested shop address');
  });

  it('does not treat Details Austin as the shop city', () => {
    const result = validateEditingForm(baseFormData, {
      mode: 'shop_only',
      shopAddress: {
        streetAddress: '410 E Pecan St',
        unitApt: '',
        city: '',
        state: '',
        zip: '',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Choose a suggested shop address');
  });

  it('accepts shop_only with Pflugerville shop fields while serving Austin', () => {
    const result = validateEditingForm(baseFormData, {
      mode: 'shop_only',
      shopAddress: {
        streetAddress: '410 E Pecan St',
        unitApt: '',
        city: 'Pflugerville',
        state: 'TX',
        zip: '78660',
      },
    });

    expect(result.isValid).toBe(true);
  });

  it('requires a specialty when the industry has niches', () => {
    const result = validateEditingForm(
      { ...baseFormData, specialties: [] },
      DEFAULT_SERVICE_LOCATION_UI
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Pick at least one thing people hire you for'
    );
  });
});
