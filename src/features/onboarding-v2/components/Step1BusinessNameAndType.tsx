/* eslint-disable no-unused-vars */
'use client';

import { Button, Input, Select } from '@/components/shared';
import React, { useState } from 'react';

// Categories for target audience: auto, exterior cleaning, lawn, beauty, mobile repair, window tinting, etc.
const SERVICE_TYPES = [
  { value: 'Auto & Detailing', label: 'Auto & Detailing' },
  { value: 'Pressure Washing', label: 'Pressure Washing' },
  { value: 'Lawn Care & Landscaping', label: 'Lawn Care & Landscaping' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Mobile Repair', label: 'Mobile Repair' },
  { value: 'Window Tinting', label: 'Window Tinting' },
  { value: 'Other', label: 'Other' },
];

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

  const canContinue = businessName.trim().length > 0;

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
          businessType: businessType.trim() || '',
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
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          What&apos;s your business name?
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          This is the name customers will see. You can change it later.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4 sm:p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div className="space-y-6">
          <Input
            label="Business name"
            placeholder="e.g. Joyce's Braids"
            value={businessName}
            onChange={value => onUpdate({ businessName: value })}
            required
          />
          <Select
            label="What type of business is this?"
            placeholder="Pick one"
            value={businessType}
            onChange={value => onUpdate({ businessType: value })}
            options={SERVICE_TYPES}
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            onClick={handleNext}
            variant="inverse"
            size="lg"
            disabled={!canContinue || isLoading}
            loading={isLoading}
            className="w-full sm:w-auto min-w-[140px]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
