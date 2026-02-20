/**
 * CreateLinkCard - Inline create-link form with same urgency as Settings
 * Shown on dashboard when user has no custom link (Required pill + amber callout)
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
          slugInput: customSlugInput.trim(),
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
      padding="lg"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Custom link
        </h2>
        <span
          className="flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-400 text-xs font-semibold"
          title="Create a link to share your profile"
        >
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          Required
        </span>
      </div>
      <div className="mt-3 mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/90">
          Without a custom link you can’t share your profile with customers.
          Create one below so people can find you and book your services.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20">
          <span className="py-3 px-4 text-gray-500 font-mono text-sm border-r border-white/10">
            {APP_DOMAIN}/
          </span>
          <input
            type="text"
            value={customSlugInput}
            onChange={e => setCustomSlugInput(e.target.value)}
            placeholder="my-business"
            disabled={isUpdating}
            className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-sm outline-none placeholder:text-gray-500"
          />
        </div>
        {slugError && (
          <p className="text-sm text-red-400">{slugError}</p>
        )}
        <Button
          onClick={handleSaveSlug}
          variant="inverse"
          size="lg"
          loading={isUpdating}
          disabled={isUpdating || !customSlugInput.trim()}
          className="w-full sm:w-auto"
        >
          {isUpdating ? 'Creating…' : 'Create link'}
        </Button>
      </div>
    </GlassCard>
  );
};

export default CreateLinkCard;
