'use client';

import { Button } from '@/components/shared';
import { MegaphoneIcon, TicketIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface MarketingEmptyStateProps {
  type: 'promo-codes' | 'sales';
  onCreateClick: () => void;
}

export const MarketingEmptyState: React.FC<MarketingEmptyStateProps> = ({
  type,
  onCreateClick,
}) => {
  const isPromoCode = type === 'promo-codes';

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
        {isPromoCode ? (
          <TicketIcon className="h-8 w-8 text-orange-500" />
        ) : (
          <MegaphoneIcon className="h-8 w-8 text-orange-500" />
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        {isPromoCode ? 'No promo codes yet' : 'No sales yet'}
      </h3>
      <p className="mb-6 max-w-md text-sm text-gray-400">
        {isPromoCode
          ? 'Create discount codes that customers can enter at checkout to get special pricing.'
          : 'Run sales promotions that automatically apply discounts to bookings during specific periods.'}
      </p>
      <Button onClick={onCreateClick} variant="primary" size="md">
        {isPromoCode ? 'Create Promo Code' : 'Create Sale'}
      </Button>
    </div>
  );
};
