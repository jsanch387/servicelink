/**
 * Business Profile Editing Helpers
 *
 * Centralized helper functions for editing business profiles.
 * Handles validation, data transformation, and API calls.
 */

import { BusinessProfileApi } from '../../services/businessProfileApi';

export interface EditingFormData {
  business_name: string;
  business_type: string;
  service_area: string;
  bio: string;
  phone_number_call: string;
  phone_number_text: string;
  same_phone_for_both: boolean;
  cover_image_url?: string;
  logo_url?: string;
  logo_path?: string;
  banner_path?: string;
  services: ServiceFormData[];
  images: ImageFormData[];
}

export interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  hours_to_complete: number | null;
  isEditing?: boolean;
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

/**
 * Validates the complete editing form
 */
export function validateEditingForm(
  formData: EditingFormData
): ValidationResult {
  const errors: string[] = [];

  // Business Information Validation
  if (!formData.business_name.trim()) {
    errors.push('Business name is required');
  }
  if (!formData.business_type.trim()) {
    errors.push('Business type is required');
  }
  if (!formData.service_area.trim()) {
    errors.push('Service area is required');
  }

  // Phone Validation (single number for customers to call)
  if (!formData.phone_number_call || formData.phone_number_call.length !== 10) {
    errors.push('Phone number must be 10 digits');
  }

  // Services Validation
  formData.services.forEach((service, index) => {
    if (!service.name.trim()) {
      errors.push(`Service ${index + 1}: Name is required`);
    }
    if (!service.price.trim()) {
      errors.push(`Service ${index + 1}: Price is required`);
    }
    if (service.price && isNaN(parseInt(service.price))) {
      errors.push(`Service ${index + 1}: Price must be a valid number`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Transforms form data for API submission
 */
export function transformFormDataForAPI(
  formData: EditingFormData,
  _businessProfileId: string
) {
  const servicesToSave = formData.services.map(service => ({
    id: service.id?.toString().startsWith('temp-') ? undefined : service.id,
    name: service.name,
    description: service.description || null,
    price_cents: service.price ? parseInt(service.price) * 100 : 0,
    hours_to_complete: service.hours_to_complete || null,
    is_active: true,
  }));

  const imagesToSave = formData.images
    .filter(image => {
      // Only include images with real storage paths (not preview images)
      const hasRealStoragePath =
        image.storage_path &&
        image.storage_path.includes('businesses/') &&
        (!image.id || !image.id.toString().startsWith('preview-'));

      return hasRealStoragePath;
    })
    .map(image => ({
      storage_path: image.storage_path,
      position: image.position,
    }));

  return {
    businessProfile: {
      business_name: formData.business_name,
      business_type: formData.business_type,
      service_area: formData.service_area,
      bio: formData.bio,
      phone_number_call: formData.phone_number_call,
      phone_number_text: null, // Single number only; customers call this number
      logo_path: formData.logo_path,
      banner_path: formData.banner_path,
    },
    services: servicesToSave,
    images: imagesToSave,
  };
}

/**
 * Saves the complete business profile
 */
export async function saveBusinessProfile(
  businessProfileId: string,
  formData: EditingFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate form data
    const validation = validateEditingForm(formData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Transform data for API
    const apiData = transformFormDataForAPI(formData, businessProfileId);

    // Save business profile (basic info)
    const profileResult = await BusinessProfileApi.updateBusinessProfile(
      businessProfileId,
      apiData.businessProfile
    );
    if (!profileResult.success) {
      return {
        success: false,
        error: profileResult.error || 'Failed to save business profile',
      };
    }

    // Save services
    const servicesResult = await BusinessProfileApi.updateServices(
      businessProfileId,
      apiData.services
    );
    if (!servicesResult.success) {
      return {
        success: false,
        error: servicesResult.error || 'Failed to save services',
      };
    }

    // Save images
    const imagesResult = await BusinessProfileApi.updateImages(
      businessProfileId,
      apiData.images
    );
    if (!imagesResult.success) {
      return {
        success: false,
        error: imagesResult.error || 'Failed to save images',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'An unexpected error occurred while saving',
    };
  }
}

/**
 * Formats phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

/**
 * Formats price for display
 */
export function formatPriceForDisplay(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}

/**
 * Creates a new service form data object
 */
export function createNewService(): ServiceFormData {
  return {
    name: '',
    description: '',
    price: '',
    hours_to_complete: null,
    isEditing: false,
  };
}

/**
 * Creates a new image form data object
 */
export function createNewImage(
  file: File,
  businessProfileId: string,
  position: number
): ImageFormData {
  const previewUrl = URL.createObjectURL(file);
  const mockStoragePath = `portfolio/${businessProfileId}/${Date.now()}-${file.name}`;

  return {
    id: `temp-${Date.now()}`,
    storage_path: mockStoragePath,
    position,
    preview_url: previewUrl,
  };
}

/**
 * Cleans up preview URLs to prevent memory leaks
 */
export function cleanupPreviewUrls(images: ImageFormData[]): void {
  images.forEach(image => {
    if (image.preview_url) {
      URL.revokeObjectURL(image.preview_url);
    }
  });
}
