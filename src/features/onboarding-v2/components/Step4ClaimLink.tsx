'use client';

import { SLUG_MAX_LENGTH } from '@/constants/slug';
import { Button } from '@/components/shared';
import React, { useState } from 'react';

const APP_DOMAIN = 'myservicelink.app';

function sanitizeSlugInput(value: string): string {
  // Normalize to lowercase and allow only letters, numbers, hyphens (stored lowercase in DB).
  const lower = value.toLowerCase();
  const withDashes = lower.replace(/[\s_]+/g, '-');
  const cleaned = withDashes.replace(/[^a-z0-9-]/g, '');
  const collapsed = cleaned.replace(/-+/g, '-');
  return collapsed.slice(0, SLUG_MAX_LENGTH);
}

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
  const slugLength = slug.length;

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
          slugInput: slug.trim().toLowerCase(),
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
        <div className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <p className="text-sm text-gray-200 font-medium">
              Your public link
            </p>
            <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20">
              <span className="py-2.5 px-4 sm:py-3 text-gray-500 font-mono text-xs sm:text-sm border-b border-white/10 sm:border-b-0 sm:border-r flex-shrink-0">
                {APP_DOMAIN}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => onUpdate(sanitizeSlugInput(e.target.value))}
                placeholder="my-business"
                disabled={saving}
                className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
                aria-label="Custom link slug"
                maxLength={SLUG_MAX_LENGTH}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Use letters, numbers, and hyphens only (e.g. elite-detail)
              </span>
              <span
                className={
                  slugLength >= SLUG_MAX_LENGTH ? 'text-amber-400' : undefined
                }
              >
                {slugLength}/{SLUG_MAX_LENGTH}
              </span>
            </div>
          </div>
          {slug.trim() && (
            <p className="text-xs text-gray-400 font-mono break-all">
              {APP_DOMAIN}/{slugForDisplay}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button type="button" onClick={onBack} variant="secondary" size="md">
            Back
          </Button>
          <Button
            type="button"
            onClick={handleClaim}
            variant="inverse"
            size="md"
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
