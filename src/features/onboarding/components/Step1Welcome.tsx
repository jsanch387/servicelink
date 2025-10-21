'use client';

import { Button } from '@/components/shared';
import React, { useState } from 'react';

interface Step1WelcomeProps {
  profileId: string;
  onStart: () => Promise<string | null>; // Returns business profile ID or null if failed
  onNext: () => void;
}

// Helper component for individual feature blocks - Mobile optimized
const FeatureBlock = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="p-4 sm:p-5 bg-neutral-900 rounded-xl transition duration-300 hover:bg-neutral-700/50 group border border-neutral-800 hover:border-orange-400/50">
    <div className="flex items-center mb-2">
      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 flex-shrink-0"></div>
      <h3 className="text-white font-semibold text-base sm:text-lg leading-tight">
        {title}
      </h3>
    </div>
    <p className="text-sm sm:text-base text-gray-400 leading-relaxed ml-5">
      {description}
    </p>
  </div>
);

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
    <div className="max-w-4xl mx-auto text-center px-4sm:px-6 lg:px-8">
      {/* Header Section - Clean and Simple */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
          Welcome to
          <span className="text-orange-400"> ServiceLink</span>!
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Let&apos;s create your professional business profile in just a few
          simple, guided steps.
        </p>
      </div>

      {/* What You'll Get Section - Mobile Optimized */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
          What You'll Get
        </h2>

        {/* Benefits Grid - Mobile First */}
        <div className="space-y-4 sm:space-y-6">
          <FeatureBlock
            title="Your Own Business Page"
            description="A simple page that shows who you are and what you do. Like a business card, but online."
          />

          <FeatureBlock
            title="Show What You Do"
            description="Tell people about your services and how much they cost. Make it easy for them to understand."
          />

          <FeatureBlock
            title="Show Your Best Work"
            description="Share pictures and stories of your best projects. Let customers see how good you are."
          />

          <FeatureBlock
            title="Easy to Contact You"
            description="Customers can call, text, or email you directly. No more missed customers."
          />
        </div>
      </div>

      {/* Error and Action Section */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 sm:mb-8 mx-2 sm:mx-0">
          <p className="text-red-400 text-sm font-medium text-center">
            {error}
          </p>
        </div>
      )}

      <div className="px-2 sm:px-0">
        <Button
          onClick={handleGetStarted}
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 sm:px-12 text-base sm:text-lg tracking-wide shadow-orange-500/30 shadow-lg"
        >
          {isLoading ? 'Setting up...' : 'Get Started Now'}
        </Button>
      </div>

      <p className="text-sm text-gray-500 mt-4 sm:mt-6 px-2 sm:px-0">
        <span className="font-semibold">Quick Setup:</span> Takes less than 5
        minutes • Skip steps anytime
      </p>
    </div>
  );
};
