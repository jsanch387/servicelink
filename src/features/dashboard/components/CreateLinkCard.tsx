/**
 * CreateLinkCard - Create booking link when none exists yet
 */

'use client';

import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import { Button, RequiredLabel, WarningCallout } from '@/components/shared';
import { DashboardGlassCard } from './DashboardGlassCard';
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
    <DashboardGlassCard fillGridCell={false} className="w-full min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-sm text-zinc-400">Booking link</p>
        <RequiredLabel title="Add a booking link for customers" />
      </div>

      <WarningCallout className="mb-4">
        Choose a URL so customers can book you.
      </WarningCallout>

      <div className="space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 min-w-0">
          <span className="py-2.5 px-3 text-zinc-500 font-mono text-xs sm:text-sm border-b border-white/[0.08] sm:border-b-0 sm:border-r flex-shrink-0">
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
            className="flex-1 min-w-0 py-2.5 px-3 bg-transparent text-white font-mono text-sm outline-none placeholder:text-zinc-600"
            aria-label="Booking link slug"
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
          {isUpdating ? 'Creating…' : 'Create booking link'}
        </Button>
      </div>
    </DashboardGlassCard>
  );
};

export default CreateLinkCard;
