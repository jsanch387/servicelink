/**
 * Types for business profile edit form state.
 */

export interface EditingFormData {
  business_name: string;
  business_type: string;
  service_area: string;
  business_zip: string;
  bio: string;
  phone_number_call: string;
  phone_number_text: string;
  same_phone_for_both: boolean;
  cover_image_url?: string;
  logo_url?: string;
  logo_path?: string;
  banner_path?: string;
  images: ImageFormData[];
}

export interface ImageFormData {
  id?: string;
  storage_path: string;
  position: number;
  preview_url?: string;
  file_type?: string;
  original_type?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
