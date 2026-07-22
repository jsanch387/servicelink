import { describe, expect, it } from 'vitest';

import { validateEditingForm } from '../utils/editing/editingValidation';
import type { EditingFormData } from '../utils/editing/editingTypes';
import { DEFAULT_SERVICE_LOCATION_UI } from '../utils/serviceLocationMode';

const baseFormData: EditingFormData = {
  business_name: 'Test Detailing',
  business_type: 'auto_detailing',
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
        'ZIP is required',
      ])
    );
  });

  it('requires full shop address when shop is offered', () => {
    const result = validateEditingForm(baseFormData, {
      mode: 'shop_only',
      shopAddress: { streetAddress: '', unitApt: '' },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Shop street address is required');
  });

  it('accepts shop_only with street and profile location', () => {
    const result = validateEditingForm(baseFormData, {
      mode: 'shop_only',
      shopAddress: { streetAddress: '123 Main St', unitApt: 'Suite 4' },
    });

    expect(result.isValid).toBe(true);
  });
});
