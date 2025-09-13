/**
 * Onboarding Actions Helper Functions
 *
 * Handles onboarding actions like starting, updating progress, and completing
 */

import { ProfileService } from '@/features/profiles';
import { BusinessProfileService } from '../../services/businessProfileService';

/**
 * Starts onboarding process
 * Creates business profile and updates user status
 */
export async function startOnboarding(userId: string): Promise<{
  success: boolean;
  businessProfileId?: string;
  error?: string;
}> {
  console.log('🚀 Starting onboarding for user:', userId);

  try {
    // Create business profile
    const result = await BusinessProfileService.startOnboarding(userId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log('✅ Onboarding started successfully');
    return {
      success: true,
      businessProfileId: result.data.id,
    };
  } catch (error) {
    console.error('❌ Error starting onboarding:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to start onboarding',
    };
  }
}

/**
 * Updates onboarding progress
 * Updates both user profile step and business profile data
 */
export async function updateOnboardingProgress(
  userId: string,
  step: number,
  businessProfileId: string,
  businessData?: any
): Promise<{ success: boolean; error?: string }> {
  console.log(`📈 Updating onboarding progress: Step ${step}`);

  try {
    // Update user profile step
    const profileResult = await ProfileService.updateProfile(userId, {
      onboarding_step: step,
      onboarding_status: 'in_progress',
    });

    if (!profileResult.success) {
      console.error('❌ Failed to update user profile:', profileResult.error);
      return { success: false, error: profileResult.error };
    }

    // Update business profile data if provided
    if (businessData) {
      const businessResult = await BusinessProfileService.updateBusinessProfile(
        businessProfileId,
        businessData
      );

      if (!businessResult.success) {
        console.error(
          '❌ Failed to update business profile:',
          businessResult.error
        );
        return { success: false, error: businessResult.error };
      }
    }

    console.log('✅ Onboarding progress updated');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating onboarding progress:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update progress',
    };
  }
}

/**
 * Completes onboarding process
 * Sets status to completed
 */
export async function completeOnboarding(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log('🎉 Completing onboarding for user:', userId);

  try {
    const result = await ProfileService.updateProfile(userId, {
      onboarding_status: 'completed',
    });

    if (!result.success) {
      console.error('❌ Failed to complete onboarding:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Onboarding completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error completing onboarding:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding',
    };
  }
}

/**
 * Saves step data and progresses to next step
 */
export async function saveStepAndProgress(
  userId: string,
  currentStep: number,
  businessProfileId: string,
  stepData: any,
  isSkipping: boolean = false
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `💾 Saving step ${currentStep} data:`,
    isSkipping ? '(SKIPPING)' : stepData
  );

  try {
    const nextStep = currentStep + 1;

    // Update progress with step data (even if skipping, we track the step)
    const result = await updateOnboardingProgress(
      userId,
      nextStep,
      businessProfileId,
      isSkipping ? {} : stepData // Don't save data if skipping
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log(`✅ Step ${currentStep} saved, progressed to step ${nextStep}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error saving step ${currentStep}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save step',
    };
  }
}
