/**
 * Onboarding State Helper Functions
 *
 * Handles getting and managing onboarding state
 */

import { ProfileService } from '@/features/profiles';
import { BusinessProfileService } from '../../services/businessProfileService';
import { BusinessServicesService } from '../../services/businessServicesService';
import { BusinessImagesService } from '../../services/businessImagesService';

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  userProfile: any;
  businessProfile: any;
  services: any[];
  images: any[];
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
  console.log('🔍 Getting onboarding state for user:', userId);

  try {
    // Get user profile
    const profileResult = await ProfileService.getProfile(userId);
    if (!profileResult.success) {
      console.error('❌ Failed to get user profile:', profileResult.error);
      return { success: false, error: profileResult.error };
    }

    const userProfile = profileResult.data;
    console.log('📋 User profile:', {
      onboarding_status: userProfile.onboarding_status,
      onboarding_step: userProfile.onboarding_step,
    });

    // Get business profile (may not exist yet)
    const businessResult =
      await BusinessProfileService.getBusinessProfileByProfileId(userId);
    const businessProfile = businessResult.success ? businessResult.data : null;

    console.log(
      '🏢 Business profile:',
      businessProfile ? 'Found' : 'Not found'
    );

    // Determine onboarding state first
    const status = userProfile.onboarding_status || 'not_started';
    const currentStep = Math.max(userProfile.onboarding_step || 1, 1);

    // Only fetch detailed data if onboarding is not completed
    let services: any[] = [];
    let images: any[] = [];
    let contactInfo = {
      phone_number_call: null as string | null,
      phone_number_text: null as string | null,
    };

    if (status !== 'completed' && businessProfile) {
      console.log('📊 Onboarding not completed, fetching detailed data...');

      // Get services
      const servicesResult =
        await BusinessServicesService.getServicesByBusinessId(
          businessProfile.id
        );
      services = servicesResult.success ? servicesResult.data || [] : [];
      console.log('🛠️ Services:', services.length);

      // Get images
      const imagesResult = await BusinessImagesService.getImagesByBusinessId(
        businessProfile.id
      );
      images = imagesResult.success ? imagesResult.data || [] : [];
      console.log('🖼️ Images:', images.length);

      // Get contact info from business profile
      contactInfo = {
        phone_number_call: businessProfile.phone_number_call,
        phone_number_text: businessProfile.phone_number_text,
      };
      console.log('📞 Contact info:', contactInfo);
    } else if (status === 'completed') {
      console.log('✅ Onboarding completed - skipping detailed data fetch');
    }

    const state: OnboardingState = {
      status,
      currentStep,
      userProfile,
      businessProfile,
      services,
      images,
      contactInfo,
    };

    console.log('✅ Onboarding state determined:', {
      status,
      currentStep,
      hasBusinessProfile: !!businessProfile,
      servicesCount: services.length,
      imagesCount: images.length,
      hasContactInfo: !!(
        contactInfo.phone_number_call || contactInfo.phone_number_text
      ),
    });

    return { success: true, data: state };
  } catch (error) {
    console.error('❌ Error getting onboarding state:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get onboarding state',
    };
  }
}
