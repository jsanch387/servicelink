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
  try {
    // Create business profile
    const result = await BusinessProfileService.startOnboarding(userId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      businessProfileId: (result.data as any)?.id || '',
    };
  } catch (error) {
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
  businessData?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user profile step
    const profileResult = await ProfileService.updateProfile(userId, {
      onboarding_step: step,
      onboarding_status: 'in_progress',
    });

    if (!profileResult.success) {
      return { success: false, error: profileResult.error };
    }

    // Update business profile data if provided
    if (businessData) {
      const businessResult = await BusinessProfileService.updateBusinessProfile(
        businessProfileId,
        businessData
      );

      if (!businessResult.success) {
        return { success: false, error: businessResult.error };
      }
    }

    return { success: true };
  } catch (error) {
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
  try {
    const result = await ProfileService.updateProfile(userId, {
      onboarding_status: 'completed',
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
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
  stepData: Record<string, unknown>,
  isSkipping: boolean = false
): Promise<{ success: boolean; error?: string }> {
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

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save step',
    };
  }
}
