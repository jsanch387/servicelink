'use client';

import { Button, GlassCard } from '@/components/shared';
import React, { useState } from 'react';

interface Step1WelcomeProps {
  profileId: string;
  onStart: () => Promise<string | null>;
  onNext: () => void;
}

export const Step1Welcome: React.FC<Step1WelcomeProps> = ({
  onStart,
  onNext,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGetStarted = async () => {
    setIsLoading(true);
    setError('');
    try {
      const businessProfileId = await onStart();
      if (!businessProfileId) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }
      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome to <span className="text-orange-400">ServiceLink</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Let&apos;s get you a page for your business.
        </p>
      </div>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-orange-500"
        showBlur={true}
        className="mb-8 text-left p-4"
      >
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
          You&apos;ll add your business name, what you do, and how customers can
          reach you. Then you get a link to share—like a business card, but
          online. We&apos;ll walk you through it.
        </p>
      </GlassCard>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGetStarted}
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        className="w-full sm:w-auto min-w-[200px]"
      >
        {isLoading ? 'Setting up…' : 'Get started'}
      </Button>

      <p className="text-xs text-gray-500 mt-4">Takes a few minutes.</p>
    </div>
  );
};
