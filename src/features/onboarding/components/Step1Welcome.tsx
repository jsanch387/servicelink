'use client';

import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/shared';

interface Step1WelcomeProps {
  profileId: string;
  onStart: () => Promise<string | null>; // Returns business profile ID or null if failed
  onNext: () => void;
}

export const Step1Welcome: React.FC<Step1WelcomeProps> = ({
  profileId,
  onStart,
  onNext,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGetStarted = async () => {
    console.log('🎯 User clicked "Get Started" - Profile ID:', profileId);
    setIsLoading(true);
    setError('');

    try {
      const businessProfileId = await onStart();

      if (!businessProfileId) {
        setError('Failed to start onboarding. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Step 1 completed, moving to Step 2');
      onNext();
    } catch (error) {
      console.error('❌ Error in Step 1:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to BusinessLink!
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Let&apos;s create your professional business profile in just a few
          simple steps.
        </p>
      </div>

      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          What you&apos;ll get:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">Professional business profile</span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">Showcase your services</span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">Display your portfolio</span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">Connect with customers</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGetStarted}
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={isLoading}
        className="w-full sm:w-auto px-12"
      >
        {isLoading ? 'Setting up...' : 'Get Started'}
      </Button>

      <p className="text-sm text-gray-400 mt-4">
        Takes less than 5 minutes • You can skip any step
      </p>
    </div>
  );
};
