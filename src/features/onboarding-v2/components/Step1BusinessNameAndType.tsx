'use client';

import { Button, Input, Select } from '@/components/shared';
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes';
import React, { useState } from 'react';

interface Step1BusinessNameAndTypeProps {
  profileId: string;
  businessProfileId?: string;
  businessName: string;
  businessType: string;
  onUpdate: (updates: { businessName?: string; businessType?: string }) => void;
  onNext: (newBusinessProfileId?: string) => void;
}

export const Step1BusinessNameAndType: React.FC<
  Step1BusinessNameAndTypeProps
> = ({ businessProfileId, businessName, businessType, onUpdate, onNext }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const canContinue =
    businessName.trim().length > 0 && businessType.trim().length > 0;

  const handleNext = async () => {
    if (!canContinue || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding-v2/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId: businessProfileId ?? null,
          businessName: businessName.trim(),
          businessType: businessType.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      onNext(data.businessProfileId);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-sm:pb-28">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          What&apos;s your business name?
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          This is the name customers will see. You can change it later.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div className="space-y-6">
          <Input
            label="Business name"
            placeholder="e.g. Shine Auto Detailing"
            value={businessName}
            onChange={value => onUpdate({ businessName: value })}
            required
          />
          <Select
            label="What type of business is this?"
            placeholder="Pick one"
            value={businessType}
            onChange={value => onUpdate({ businessType: value })}
            options={BUSINESS_TYPE_OPTIONS}
            required
          />
        </div>
      </div>

      <p className="mt-3 text-left text-sm text-gray-400 leading-relaxed sm:mt-4">
        Pick the type that fits your business best. We use it so your booking
        form and settings make sense for what you offer.
      </p>

      <div className="mt-8 hidden flex-col gap-3 sm:flex sm:flex-row sm:justify-end">
        <Button
          onClick={handleNext}
          variant="inverse"
          disabled={!canContinue || isLoading}
          loading={isLoading}
          className="w-full sm:w-auto min-w-[140px]"
        >
          Next
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-2xl justify-stretch">
          <Button
            onClick={handleNext}
            variant="inverse"
            disabled={!canContinue || isLoading}
            loading={isLoading}
            className="w-full font-semibold"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
