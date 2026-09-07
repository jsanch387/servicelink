'use client';

import { Button, GlassCard } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

export type ContactFormSuccessProps = {
  /** When set, shows a full-width inverse “Done” button. */
  doneHref?: string;
  onDone?: () => void;
  replyEmail?: string;
  compact?: boolean;
};

export const ContactFormSuccess: React.FC<ContactFormSuccessProps> = ({
  doneHref,
  onDone,
  replyEmail,
  compact = false,
}) => {
  const replyLine = replyEmail
    ? `We'll reply to ${replyEmail} within 24 hours.`
    : 'Thanks for reaching out. We typically reply within 24 hours.';

  const body = (
    <>
      <div
        className={`mx-auto mb-4 flex items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25 ${
          compact ? 'h-11 w-11' : 'h-14 w-14'
        }`}
      >
        <CheckIcon
          className={compact ? 'h-6 w-6 text-white' : 'h-7 w-7 text-white'}
          aria-hidden
        />
      </div>
      <h2
        className={`font-semibold text-white mb-2 ${
          compact ? 'text-base' : 'text-lg'
        }`}
      >
        Message sent
      </h2>
      <p className="text-sm text-gray-400 leading-relaxed break-words">
        {replyLine}
      </p>
      {onDone ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="inverse"
            size={compact ? 'md' : 'lg'}
            fullWidth
            onClick={onDone}
          >
            Close
          </Button>
        </div>
      ) : doneHref ? (
        <div className="mt-6">
          <Button href={doneHref} variant="inverse" size="lg" fullWidth>
            Done
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <div role="status" aria-live="polite" className="w-full">
      {compact ? (
        <div className="w-full text-center">{body}</div>
      ) : (
        <GlassCard
          padding="md"
          rounded="rounded-2xl"
          className="w-full text-center"
        >
          {body}
        </GlassCard>
      )}
    </div>
  );
};
