/**
 * Contact Types - Onboarding Feature
 *
 * Shared types for contact information functionality.
 * Single source of truth for contact-related types.
 */

export interface ContactInfo {
  phone_number_call: string | null;
  phone_number_text: string | null;
  same_phone_for_both: boolean;
}

export interface ContactFormData {
  phoneCall: string;
  phoneText: string;
  samePhoneForBoth: boolean;
}

// For existing data from database
export interface ContactExistingData {
  phone_number_call?: string | null;
  phone_number_text?: string | null;
}

// Phone number validation result
export interface PhoneValidation {
  isValid: boolean;
  formatted: string;
  error?: string;
}
