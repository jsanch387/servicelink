/**
 * Business Profile Editing Helpers
 *
 * Centralized helper functions for editing business profiles.
 * Handles validation, data transformation, and API calls.
 */

import { BusinessProfileApi } from '../../services/businessProfileApi';
import type { BookingLinkLocalesUiState } from '../bookingLinkLocales';
import { bookingLinkLocalesPersistFromUi } from '../bookingLinkLocales';
import type { ServiceLocationUiState } from '../serviceLocationMode';
import { serviceLocationPersistFromUi } from '../serviceLocationMode';
import { socialMediaForPersist } from '../socialMedia';
import type { EditingFormData, ImageFormData } from './editingTypes';
import { validateEditingForm } from './editingValidation';

export type {
  EditingFormData,
  ImageFormData,
  ValidationResult,
} from './editingTypes';
export { validateEditingForm } from './editingValidation';
export { isValidCityStateServiceArea } from '../businessLocation';

/**
 * Transforms form data for API submission
 */
export function transformFormDataForAPI(
  formData: EditingFormData,
  _businessProfileId: string,
  serviceLocation: ServiceLocationUiState
) {
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
      service_area: formData.service_area.trim(),
      business_zip: formData.business_zip.trim(),
      ...serviceLocationPersistFromUi(serviceLocation),
      bio: formData.bio,
      phone_number_call: formData.phone_number_call,
      phone_number_text: null, // Single number only; customers call this number
      social_media: socialMediaForPersist({
        instagram: formData.instagram,
        tiktok: formData.tiktok,
      }),
      logo_path: formData.logo_path,
      banner_path: formData.banner_path,
    },
    images: imagesToSave,
  };
}

/**
 * Saves the complete business profile
 */
export async function saveBusinessProfile(
  businessProfileId: string,
  formData: EditingFormData,
  bookingLinkLocales: BookingLinkLocalesUiState,
  serviceLocation: ServiceLocationUiState
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate form data
    const validation = validateEditingForm(formData, serviceLocation);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Transform data for API
    const apiData = transformFormDataForAPI(
      formData,
      businessProfileId,
      serviceLocation
    );
    const bookingPersist = bookingLinkLocalesPersistFromUi(bookingLinkLocales);

    // Save business profile (basic info + booking link locale settings)
    const profileResult = await BusinessProfileApi.updateBusinessProfile(
      businessProfileId,
      {
        ...apiData.businessProfile,
        ...bookingPersist,
      }
    );
    if (!profileResult.success) {
      return {
        success: false,
        error: profileResult.error || 'Failed to save business profile',
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
