import { getBioLengthValidationError } from '../../constants/businessBio';
import {
  parseServiceAreaCityState,
  validateBusinessLocation,
} from '../businessLocation';
import type { ServiceLocationUiState } from '../serviceLocationMode';
import { validateServiceLocation } from '../serviceLocationMode';
import type { EditingFormData, ValidationResult } from './editingTypes';

/** Validates the complete editing form (no API dependencies). */
export function validateEditingForm(
  formData: EditingFormData,
  serviceLocation: ServiceLocationUiState
): ValidationResult {
  const errors: string[] = [];

  if (!formData.business_name.trim()) {
    errors.push('Business name is required');
  }
  if (!formData.business_type.trim()) {
    errors.push('Business type is required');
  }

  const { city, state } = parseServiceAreaCityState(formData.service_area);
  errors.push(
    ...validateBusinessLocation({
      city,
      state,
      zip: formData.business_zip,
    })
  );
  errors.push(
    ...validateServiceLocation(serviceLocation, {
      city,
      state,
      zip: formData.business_zip,
    })
  );

  if (
    formData.phone_number_call &&
    formData.phone_number_call.trim() !== '' &&
    formData.phone_number_call.length !== 10
  ) {
    errors.push('Phone number must be 10 digits');
  }

  const bioError = getBioLengthValidationError(formData.bio);
  if (bioError) {
    errors.push(bioError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
