'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';

interface Step5DoneProps {
  /** Slug for display only (e.g. "Your link: myservicelink.app/slug"). */
  slug: string;
}

export const Step5Done: React.FC<Step5DoneProps> = ({ slug }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeeProfile = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding-v2/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      window.location.href = ROUTES.DASHBOARD.BUSINESS_PROFILE;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 text-white mb-6">
          <CheckCircleIcon className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          You&apos;re all set
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          We&apos;ll take you to your profile page so you can see what customers
          see when they use your link.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        {slug.trim() && (
          <p className="text-gray-400 text-xs mb-4">
            Your link: myservicelink.app/{slug.trim()}
          </p>
        )}
        <p className="text-gray-300 text-sm mb-6">
          Click below to go to your profile. That&apos;s the page customers see
          will see when they visit your link.
        </p>
        <Button
          onClick={handleSeeProfile}
          variant="inverse"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          icon={<CheckCircleIcon className="h-5 w-5" />}
          iconPosition="left"
          disabled={loading}
        >
          {loading ? 'Taking you there…' : 'See my profile'}
        </Button>
      </div>
    </div>
  );
};
