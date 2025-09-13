/**
 * Business Profile Helper Functions
 *
 * Utility functions for business profile feature.
 * Clean, reusable helper functions.
 */

import {
  BusinessProfileFormData,
  ServiceFormData,
} from '../types/businessProfile';

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone || phone.length !== 10) return phone || '';

  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}

/**
 * Formats price from cents to dollars
 */
export function formatPrice(cents: number | null): string {
  if (!cents) return 'Contact for quote';
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Formats price from dollars to cents
 */
export function formatPriceToCents(price: string): number | null {
  if (!price) return null;
  const numericPrice = parseInt(price.replace(/[^0-9]/g, ''), 10);
  return isNaN(numericPrice) ? null : numericPrice * 100;
}

/**
 * Validates business profile form data
 */
export function validateBusinessProfileForm(data: BusinessProfileFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.business_name?.trim()) {
    errors.push('Business name is required');
  }

  if (!data.business_type?.trim()) {
    errors.push('Business type is required');
  }

  if (!data.service_area?.trim()) {
    errors.push('Service area is required');
  }

  if (data.phone_number_call && data.phone_number_call.length !== 10) {
    errors.push('Call phone number must be 10 digits');
  }

  if (data.phone_number_text && data.phone_number_text.length !== 10) {
    errors.push('Text phone number must be 10 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates service form data
 */
export function validateServiceForm(data: ServiceFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Service name is required');
  }

  if (!data.price?.trim()) {
    errors.push('Service price is required');
  }

  if (
    data.hours_to_complete &&
    (data.hours_to_complete < 1 || data.hours_to_complete > 10)
  ) {
    errors.push('Hours to complete must be between 1 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a public ID for business profile
 */
export function generatePublicId(businessName: string): string {
  const cleanName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = Date.now().toString(36);
  return `${cleanName}-${timestamp}`;
}

/**
 * Checks if onboarding is completed
 */
export function isOnboardingCompleted(
  onboardingStatus: string | null
): boolean {
  return onboardingStatus === 'completed';
}

/**
 * Gets display text for business type
 */
export function getBusinessTypeDisplay(businessType: string | null): string {
  if (!businessType) return 'Not specified';

  const typeMap: Record<string, string> = {
    auto_detailing: 'Auto Detailing',
    car_wash: 'Car Wash',
    mobile_detailing: 'Mobile Detailing',
    paint_correction: 'Paint Correction',
    ceramic_coating: 'Ceramic Coating',
    other: 'Other',
  };

  return typeMap[businessType] || businessType;
}

/**
 * Gets display text for service area
 */
export function getServiceAreaDisplay(serviceArea: string | null): string {
  if (!serviceArea) return 'Not specified';

  const areaMap: Record<string, string> = {
    local: 'Local Area',
    city_wide: 'City Wide',
    state_wide: 'State Wide',
    national: 'National',
    other: 'Other',
  };

  return areaMap[serviceArea] || serviceArea;
}
