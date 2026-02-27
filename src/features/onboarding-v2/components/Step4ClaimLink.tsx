'use client';

import { Button } from '@/components/shared';
import React, { useState } from 'react';

const APP_DOMAIN = 'myservicelink.app';

interface Step4ClaimLinkProps {
  businessProfileId: string | undefined;
  slug: string;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (slug: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4ClaimLink: React.FC<Step4ClaimLinkProps> = ({
  businessProfileId,
  slug,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = slug.trim().length > 0;
  const slugForDisplay = slug.trim() || 'my-business';

  const handleClaim = async () => {
    if (!businessProfileId) {
      setError('Business profile is missing. Go back and complete step 1.');
      return;
    }
    if (!slug.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/business-profile/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          slugInput: slug.trim(),
          advanceOnboardingStep: true,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error ?? 'Failed to claim link.');
        return;
      }
      onUpdate(result.data?.slug ?? slug.trim());
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          Claim your custom link
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          This is the link you&apos;ll share with customers. Pick something
          short and easy to remember.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4 sm:p-6">
        <div className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20">
            <span className="py-2.5 px-4 sm:py-3 text-gray-500 font-mono text-xs sm:text-sm border-b border-white/10 sm:border-b-0 sm:border-r flex-shrink-0">
              {APP_DOMAIN}/
            </span>
            <input
              type="text"
              value={slug}
              onChange={e => onUpdate(e.target.value)}
              placeholder="my-business"
              disabled={saving}
              className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
              aria-label="Custom link slug"
            />
          </div>
          {slug.trim() && (
            <p className="text-xs text-gray-500">
              Your full link: {APP_DOMAIN}/{slugForDisplay}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button type="button" onClick={onBack} variant="secondary" size="lg">
            Back
          </Button>
          <Button
            type="button"
            onClick={handleClaim}
            variant="inverse"
            size="lg"
            disabled={!canContinue || saving}
            className="sm:ml-auto"
          >
            {saving ? 'Claiming…' : 'Claim this link'}
          </Button>
        </div>
      </div>
    </div>
  );
};
