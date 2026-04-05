/**
 * CreateLinkCard - Inline create-link form with same urgency as Settings
 * Shown on dashboard when user has no share link (Required pill + amber callout)
 */

'use client';

import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import {
  Button,
  GlassCard,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const APP_DOMAIN = 'myservicelink.app';

interface CreateLinkCardProps {
  businessProfileId: string;
}

export const CreateLinkCard: React.FC<CreateLinkCardProps> = ({
  businessProfileId,
}) => {
  const router = useRouter();
  const [customSlugInput, setCustomSlugInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugError, setSlugError] = useState<string>('');

  const handleSaveSlug = async () => {
    setIsUpdating(true);
    setSlugError('');
    try {
      const response = await fetch('/api/business-profile/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          slugInput: sanitizeSlugInput(customSlugInput),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        setSlugError(result.error ?? 'Something went wrong.');
        return;
      }
      router.refresh();
    } catch {
      setSlugError('Something went wrong. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="text-left w-full min-w-0 p-4"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-white">Your Link</h2>
        <RequiredLabel title="Add a link to share your profile" />
      </div>
      <div className="mt-3 mb-6 min-w-0">
        <WarningCallout>
          You need a link so customers can find and book you. Create one below.
        </WarningCallout>
      </div>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 min-w-0">
          <span className="py-2.5 px-4 sm:py-3 text-gray-500 font-mono text-xs sm:text-sm border-b border-white/10 sm:border-b-0 sm:border-r flex-shrink-0">
            {APP_DOMAIN}/
          </span>
          <input
            type="text"
            value={customSlugInput}
            onChange={e =>
              setCustomSlugInput(sanitizeSlugInput(e.target.value))
            }
            placeholder="my-business"
            disabled={isUpdating}
            maxLength={SLUG_MAX_LENGTH}
            className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
            aria-label="Your link slug"
          />
        </div>
        {slugError && <p className="text-sm text-red-400">{slugError}</p>}
        <Button
          onClick={handleSaveSlug}
          variant="inverse"
          loading={isUpdating}
          disabled={isUpdating || !sanitizeSlugInput(customSlugInput)}
          className="w-full sm:w-auto"
        >
          {isUpdating ? 'Creating…' : 'Create link'}
        </Button>
      </div>
    </GlassCard>
  );
};

export default CreateLinkCard;
