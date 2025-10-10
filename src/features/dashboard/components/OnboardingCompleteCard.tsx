'use client';

import { Card } from '@/components/shared';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const OnboardingCompleteCard: React.FC = () => {
  return (
    <Card variant="success" gradient className="mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-12 w-12 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            🎉 Congratulations! Your Business Profile is Complete
          </h2>
          <p className="text-green-200">
            You&apos;ve successfully created your business profile. Your
            customers can now discover your services and contact you easily.
          </p>
        </div>
      </div>
    </Card>
  );
};
