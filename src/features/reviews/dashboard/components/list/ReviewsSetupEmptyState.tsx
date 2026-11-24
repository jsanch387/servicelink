'use client';

import { Button } from '@/components/shared';
import { StarIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { ReviewsHowItWorksModal } from '../ReviewsHowItWorksModal';

export const ReviewsSetupEmptyState: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/[0.08]">
          <StarIcon className="h-7 w-7 text-zinc-600" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-200">
          No reviews
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
          Reviews you get will show up here.
        </p>
        <Button
          type="button"
          variant="inverse"
          size="sm"
          className="mt-6"
          onClick={() => setOpen(true)}
        >
          How reviews work
        </Button>
      </div>
      <ReviewsHowItWorksModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
