import { GlassCard } from '@/components/shared';
import React from 'react';

export const CustomerListEmptyState: React.FC = () => {
  return (
    <GlassCard rounded="rounded-2xl" className="p-6 mt-3 text-center">
      <p className="text-sm text-gray-300">
        No customers match your current filters.
      </p>
    </GlassCard>
  );
};
