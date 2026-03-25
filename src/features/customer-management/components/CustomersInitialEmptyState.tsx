import { GlassCard } from '@/components/shared';
import React from 'react';

/** No rows in `customers` yet (distinct from search/filter miss). */
export const CustomersInitialEmptyState: React.FC = () => {
  return (
    <GlassCard rounded="rounded-2xl" className="p-8 sm:p-10 mt-2 text-center">
      <p className="text-base font-medium text-white">No customers yet</p>
      <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
        When someone books with you, they&apos;ll show up here.
      </p>
    </GlassCard>
  );
};
