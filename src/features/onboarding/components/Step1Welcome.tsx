'use client';

import { Button } from '@/components/shared';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
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
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 bg-neutral-900 rounded-xl transition duration-300 hover:bg-neutral-700/50 group border border-neutral-800 hover:border-orange-400/50">
    {/* Dynamic accent icon container */}
    <div className="p-1.5 sm:p-2 rounded-full bg-orange-900/40 border border-orange-500/20 flex-shrink-0">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-white font-semibold block text-sm sm:text-base leading-tight">
        {title}
      </span>
      <span className="text-xs sm:text-sm text-gray-400 block leading-relaxed mt-1">
        {description}
      </span>
    </div>
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
      {/* Header Section - Dynamic Icon and Typography */}
      <div className="mb-12 sm:mb-16">
        {/* Animated Icon Container - Responsive sizing */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border-2 border-neutral-700 shadow-xl relative overflow-hidden">
          {/* Original gradient background for flair */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-500/30 blur-2xl opacity-50 z-0"></div>
          <CheckCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white relative z-10 drop-shadow-md" />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
          Welcome to
          <span className="text-orange-400"> ServiceLink</span>!
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Let&apos;s create your professional business profile in just a few
          simple, guided steps.
        </p>
      </div>

      {/* Redesigned "What you'll get" Section - Better mobile spacing */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 mb-12 sm:mb-16 shadow-2xl sm:mx-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-8 sm:mb-10 text-center sm:text-left border-l-0 sm:border-l-4 border-orange-400 pl-0 sm:pl-3 uppercase tracking-wider">
          Core Benefits
        </h2>

        {/* Feature Grid with better mobile spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 text-left">
          <FeatureBlock
            title="Professional Business Profile"
            description="Establish a unique, credible online identity."
            icon={CheckCircleIcon}
          />

          <FeatureBlock
            title="Showcase Your Services"
            description="Clearly define offerings with pricing and details."
            icon={CheckCircleIcon}
          />

          <FeatureBlock
            title="Display Your Portfolio"
            description="Highlight successful projects and testimonials."
            icon={CheckCircleIcon}
          />

          <FeatureBlock
            title="Contact Information"
            description="Make it easy for customers to reach you and get in touch."
            icon={CheckCircleIcon}
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

      <div className="px-4 sm:px-0">
        <Button
          onClick={handleGetStarted}
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          className="w-full sm:w-auto px-8 sm:px-16 text-lg sm:text-xl tracking-wide shadow-orange-500/30 shadow-lg"
        >
          {isLoading ? 'Setting up...' : 'Get Started Now'}
        </Button>
      </div>

      <p className="text-sm sm:text-base text-gray-500 mt-6 sm:mt-8 px-4 sm:px-0">
        <span className="font-semibold">Quick Setup:</span> Takes less than 5
        minutes • Skip steps anytime
      </p>
    </div>
  );
};
