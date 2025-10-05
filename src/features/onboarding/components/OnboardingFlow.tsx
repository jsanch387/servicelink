'use client';

import { Button, SuccessMessage } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import {
  completeOnboarding,
  getOnboardingState,
  startOnboarding,
} from '../utils/onboardingHelpers';
import { Step1Welcome } from './Step1Welcome';
import { Step2BusinessInfo } from './Step2BusinessInfo';
import { Step3Services } from './Step3Services';
import { Step4Portfolio } from './Step4Portfolio';
import { Step5Contact } from './Step5Contact';

interface OnboardingFlowProps {
  profileId: string;
  businessProfileId?: string;
  initialStep?: number;
  existingData?: any; // Business profile data to populate forms
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  profileId,
  businessProfileId,
  initialStep = 1,
  existingData,
}) => {
  console.log('🎬 OnboardingFlow loaded:', {
    profileId,
    businessProfileId,
    initialStep,
    hasExistingData: !!existingData,
  });

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [currentBusinessProfileId, setCurrentBusinessProfileId] =
    useState(businessProfileId);
  const [currentData, setCurrentData] = useState(existingData);

  // Function to refresh data from the database
  const refreshData = async () => {
    if (!currentBusinessProfileId) return;

    console.log('🔄 Refreshing onboarding data...');
    try {
      const stateResult = await getOnboardingState(profileId);
      if (stateResult.success && stateResult.data) {
        const { businessProfile, services, images, contactInfo } =
          stateResult.data;
        setCurrentData({
          ...businessProfile,
          services: services,
          images: images,
          ...contactInfo,
        });
        console.log('✅ Data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }
  };

  // Refresh data when component mounts or when business profile ID changes
  useEffect(() => {
    if (
      currentBusinessProfileId &&
      currentBusinessProfileId !== businessProfileId
    ) {
      refreshData();
    }
  }, [currentBusinessProfileId, profileId]);

  const handleStartOnboarding = async (): Promise<string | null> => {
    console.log('🚀 Starting onboarding process...');

    const result = await startOnboarding(profileId);
    if (!result.success) {
      console.error('❌ Failed to start onboarding:', result.error);
      return null;
    }

    console.log(
      '✅ Onboarding started, business profile ID:',
      result.businessProfileId
    );
    setCurrentBusinessProfileId(result.businessProfileId);
    return result.businessProfileId!;
  };

  const handleStepComplete = async () => {
    const nextStep = currentStep + 1;
    console.log(`➡️ Moving to Step ${nextStep}`);

    // Refresh data after completing a step to ensure we have the latest data
    await refreshData();
    setCurrentStep(nextStep);
  };

  const handleStepBack = async () => {
    const prevStep = Math.max(currentStep - 1, 1);
    console.log(`⬅️ Going back to Step ${prevStep}`);

    // Refresh data when going back to ensure we have the latest data
    await refreshData();
    setCurrentStep(prevStep);
  };

  const handleOnboardingComplete = async () => {
    console.log('🎉 Completing onboarding...');

    const result = await completeOnboarding(profileId);
    if (result.success) {
      console.log('✅ Onboarding completed, moving to celebration step');
      setCurrentStep(6); // Move to celebration step
    } else {
      console.error('❌ Failed to complete onboarding:', result.error);
    }
  };

  const handleCelebrationComplete = () => {
    console.log('🎊 Celebration completed, redirecting to dashboard');
    window.location.reload(); // Refresh to show dashboard
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Welcome
            profileId={profileId}
            onStart={handleStartOnboarding}
            onNext={handleStepComplete}
          />
        );

      case 2:
        if (!currentBusinessProfileId) {
          console.error('❌ Step 2 requires business profile ID');
          return (
            <div className="text-center text-white">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-gray-400">
                Missing business profile. Please start over.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                variant="primary"
                size="md"
                className="mt-4"
              >
                Start Over
              </Button>
            </div>
          );
        }
        return (
          <Step2BusinessInfo
            profileId={profileId}
            businessProfileId={currentBusinessProfileId}
            existingData={currentData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );

      case 3:
        if (!currentBusinessProfileId) {
          return (
            <div className="text-center text-white">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-gray-400">
                Missing business profile. Please start over.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                variant="primary"
                size="md"
                className="mt-4"
              >
                Start Over
              </Button>
            </div>
          );
        }
        return (
          <Step3Services
            profileId={profileId}
            businessProfileId={currentBusinessProfileId}
            existingData={currentData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );

      case 4:
        if (!currentBusinessProfileId) {
          return (
            <div className="text-center text-white">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-gray-400">
                Missing business profile. Please start over.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                variant="primary"
                size="md"
                className="mt-4"
              >
                Start Over
              </Button>
            </div>
          );
        }
        return (
          <Step4Portfolio
            profileId={profileId}
            businessProfileId={currentBusinessProfileId}
            existingData={currentData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );

      case 5:
        if (!currentBusinessProfileId) {
          return (
            <div className="text-center text-white">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-gray-400">
                Missing business profile. Please start over.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                variant="primary"
                size="md"
                className="mt-4"
              >
                Start Over
              </Button>
            </div>
          );
        }
        return (
          <Step5Contact
            profileId={profileId}
            businessProfileId={currentBusinessProfileId}
            existingData={currentData}
            onNext={handleOnboardingComplete}
            onBack={handleStepBack}
          />
        );

      case 6:
        return (
          <SuccessMessage
            businessName={currentData?.business_name || 'Your Business'}
            onGoToDashboard={handleCelebrationComplete}
          />
        );

      default:
        console.error('❌ Invalid step:', currentStep);
        return (
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
            <p className="text-gray-400">Invalid step. Please start over.</p>
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Start Over
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator - Hide during celebration */}
        {currentStep !== 6 && (
          <div className="mb-8">
            <div className="flex justify-center">
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${
                        currentStep === step
                          ? 'bg-orange-500 text-white'
                          : currentStep > step
                            ? 'bg-green-500 text-white'
                            : 'bg-neutral-700 text-gray-400'
                      }
                    `}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">Step {currentStep} of 5</p>
            </div>
          </div>
        )}

        {/* Current step content */}
        {renderStep()}
      </div>
    </div>
  );
};
