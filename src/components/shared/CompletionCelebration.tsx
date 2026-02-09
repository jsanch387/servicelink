'use client';

import { Button, GlassCard } from '@/components/shared';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface SuccessMessageProps {
  businessName?: string;
  onGoToDashboard: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  onGoToDashboard,
}) => {
  return (
    <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6">
          <CheckCircleIcon className="h-9 w-9 text-orange-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          You&apos;re all set!
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          You just added your business info. Nice work.
        </p>
      </div>

      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        blurColor="bg-orange-500"
        showBlur={true}
        className="mb-8"
      >
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
          Your profile is ready. Head to your dashboard to see it and share it
          with customers.
        </p>
      </GlassCard>

      <Button
        onClick={onGoToDashboard}
        variant="primary"
        size="lg"
        className="w-full sm:w-auto min-w-[200px]"
      >
        Go to Dashboard
      </Button>
    </div>
  );
};

// Keep the old export for backward compatibility during transition
export const CompletionCelebration = SuccessMessage;
