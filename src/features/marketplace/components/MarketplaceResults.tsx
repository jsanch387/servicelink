'use client';

import type { MarketplaceBusiness } from '../types/marketplace';
import React from 'react';
import { MarketplaceResultCard } from './MarketplaceResultCard';
import { MarketplaceResultsSkeleton } from './MarketplaceResultsSkeleton';

interface MarketplaceResultsProps {
  location: string;
  businesses: MarketplaceBusiness[];
  isSearching?: boolean;
}

/** Eager-load portfolio thumbs for the first grid row (1 / 2 / 3 cols). */
const PRIORITY_CARD_COUNT = 3;

export const MarketplaceResults: React.FC<MarketplaceResultsProps> = ({
  location,
  businesses,
  isSearching = false,
}) => {
  return (
    <div className="w-full animate-hero-float-in">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-base font-medium text-white/70 sm:text-lg">
          {isSearching ? (
            <>Searching near {location}…</>
          ) : (
            <>
              {businesses.length}{' '}
              {businesses.length === 1 ? 'detailer' : 'detailers'} near{' '}
              {location}
            </>
          )}
        </h2>
      </div>

      {isSearching ? (
        <MarketplaceResultsSkeleton />
      ) : businesses.length === 0 ? (
        <p className="text-sm text-white/45">
          No detailers nearby yet. Try a nearby larger city.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business, cardIndex) => (
            <MarketplaceResultCard
              key={business.id}
              business={business}
              priority={cardIndex < PRIORITY_CARD_COUNT}
            />
          ))}
        </div>
      )}
    </div>
  );
};
