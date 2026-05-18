'use client';

import { Button, GlassCard } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

export type ContactFormSuccessProps = {
  /** When set, shows a full-width inverse “Done” button (e.g. back to Settings). */
  doneHref?: string;
};

export const ContactFormSuccess: React.FC<ContactFormSuccessProps> = ({
  doneHref,
}) => {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        className="w-full text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25">
          <CheckIcon className="h-7 w-7 text-white" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Message sent</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Thanks for reaching out. We typically reply within 24 hours.
        </p>
        {doneHref ? (
          <div className="mt-6">
            <Button href={doneHref} variant="inverse" size="lg" fullWidth>
              Done
            </Button>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
};
