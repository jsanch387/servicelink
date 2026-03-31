'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const NewQuoteCard: React.FC = () => {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <PlusCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">New Quote</h3>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-gray-400 mb-4">
          Turn a phone call into a confirmed booking in minutes.
        </p>
        <Button
          href={ROUTES.DASHBOARD.QUOTES_NEW}
          variant="secondary"
          fullWidth
          icon={<PlusCircleIcon className="h-4 w-4" />}
        >
          Create Quote
        </Button>
      </div>
    </GlassCard>
  );
};

export default NewQuoteCard;
