'use client';

import React from 'react';
import { MarketplaceHero } from './MarketplaceHero';
import { MarketplaceResults } from './MarketplaceResults';
import { MarketplaceSearch } from './MarketplaceSearch';

export const MarketplacePage: React.FC = () => {
  const [hasSearched, setHasSearched] = React.useState(false);
  const [searchParams, setSearchParams] = React.useState<{
    location: string;
    service: string;
  } | null>(null);

  const handleSearch = (location: string, service: string) => {
    setSearchParams({ location, service });
    setHasSearched(true);
  };

  const handleNewSearch = () => {
    setHasSearched(false);
    setSearchParams(null);
  };

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      {/* Full screen centered layout */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto">
          {!hasSearched ? (
            <>
              <MarketplaceHero />
              <MarketplaceSearch onSearch={handleSearch} />
            </>
          ) : (
            <MarketplaceResults
              location={searchParams?.location || ''}
              service={searchParams?.service || ''}
              onNewSearch={handleNewSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
};
