/**
 * Onboarding State Helper Functions
 *
 * Handles getting and managing onboarding state
 */

import { ProfileService } from '@/features/profiles';
import { BusinessImagesService } from '../../services/businessImagesService';
import { BusinessProfileService } from '../../services/businessProfileService';
import { BusinessServicesService } from '../../services/businessServicesService';

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  service_area?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  slug: string;
  phone_number_call: string | null;
  phone_number_text: string | null;
  [key: string]: unknown;
}

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  userProfile: Record<string, unknown>;
  businessProfile: BusinessProfile | null;
  services: Record<string, unknown>[];
  images: Record<string, unknown>[];
  contactInfo: {
    phone_number_call: string | null;
    phone_number_text: string | null;
  };
}

/**
 * Gets complete onboarding state for a user
 * This is the single source of truth for onboarding status
 */
export async function getOnboardingState(userId: string): Promise<{
  success: boolean;
  data?: OnboardingState;
  error?: string;
}> {
  try {
    // Get user profile - only fetch columns we actually need for performance
    const profileResult = await ProfileService.getProfile(
      userId,
      'user_id, onboarding_status, onboarding_step, full_name, created_at, updated_at'
    );
    if (!profileResult.success) {
      return { success: false, error: profileResult.error };
    }

    const userProfile = profileResult.data;

    // Get business profile (may not exist yet)
    const businessResult =
      await BusinessProfileService.getBusinessProfileByProfileId(userId);
    const businessProfile = businessResult.success ? businessResult.data : null;

    // Determine onboarding state first
    const status = userProfile.onboarding_status || 'not_started';
    const currentStep = Math.max(userProfile.onboarding_step || 1, 1);

    // Only fetch detailed data if onboarding is not completed
    let services: Record<string, unknown>[] = [];
    let images: Record<string, unknown>[] = [];
    let contactInfo = {
      phone_number_call: null as string | null,
      phone_number_text: null as string | null,
    };

    if (status !== 'completed' && businessProfile) {
      // Get services
      const servicesResult =
        await BusinessServicesService.getServicesByBusinessId(
          businessProfile.id as string
        );
      services = servicesResult.success
        ? (servicesResult.data as any) || []
        : [];

      // Get images
      const imagesResult = await BusinessImagesService.getImagesByBusinessId(
        businessProfile.id as string
      );
      images = imagesResult.success ? (imagesResult.data as any) || [] : [];

      // Get contact info from business profile
      contactInfo = {
        phone_number_call: businessProfile.phone_number_call as string | null,
        phone_number_text: businessProfile.phone_number_text as string | null,
      };
    }

    const state: OnboardingState = {
      status,
      currentStep,
      userProfile,
      businessProfile: businessProfile as BusinessProfile | null,
      services,
      images,
      contactInfo,
    };

    return { success: true, data: state };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get onboarding state',
    };
  }
}
