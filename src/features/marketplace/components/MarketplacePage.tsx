'use client';

import { PublicFooter } from '@/components/shared';
import { searchMarketplace } from '../api/searchMarketplace';
import type { MarketplaceBusiness } from '../types/marketplace';
import React from 'react';
import { MarketplaceDiscovery } from './MarketplaceDiscovery';
import { MarketplaceHeader } from './MarketplaceHeader';
import { MarketplaceHero } from './MarketplaceHero';
import { MarketplaceMessCallouts } from './MarketplaceMessCallouts';
import { MarketplaceResults } from './MarketplaceResults';
import { MarketplaceSearch } from './MarketplaceSearch';
import { MarketplaceShowcase } from './MarketplaceShowcase';
import { MarketplaceTrustSignal } from './MarketplaceTrustSignal';

export const MarketplacePage: React.FC = () => {
  const [hasSearched, setHasSearched] = React.useState(false);
  const [searchParams, setSearchParams] = React.useState<{
    location: string;
  } | null>(null);
  const [businesses, setBusinesses] = React.useState<MarketplaceBusiness[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [hasSearched]);

  const handleSearch = async (location: string) => {
    setIsSearching(true);
    setSearchError('');

    try {
      const result = await searchMarketplace(location);
      setBusinesses(result.businesses);
      setSearchParams({ location: result.location });
      setHasSearched(true);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Unable to search businesses right now.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewSearch = () => {
    setHasSearched(false);
    setSearchParams(null);
    setBusinesses([]);
    setSearchError('');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[var(--dashboard-bg)] text-white">
      <MarketplaceHeader />

      {!hasSearched ? (
        <main className="flex-1">
          <section className="relative z-20 px-4 pb-4 pt-12 sm:px-6 sm:pb-6 sm:pt-20 lg:px-8 lg:pt-24">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-1/2 top-[-22rem] h-[48rem] w-[48rem] -translate-x-1/2 rounded-full bg-white/[0.09] blur-[120px]" />
              <div className="absolute right-[-15rem] top-28 h-[30rem] w-[30rem] rounded-full bg-white/[0.035] blur-[110px]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
            </div>

            <div className="relative mx-auto max-w-6xl">
              <MarketplaceHero />
              <MarketplaceSearch
                onSearch={handleSearch}
                isSearching={isSearching}
                searchError={searchError}
              />
              <MarketplaceTrustSignal />
            </div>
          </section>
          <MarketplaceShowcase />
          <MarketplaceMessCallouts />
          <MarketplaceDiscovery />
        </main>
      ) : (
        <main className="relative flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="pointer-events-none absolute left-1/2 top-[-24rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[120px]" />
          <div className="relative mx-auto max-w-6xl">
            <MarketplaceResults
              location={searchParams?.location || ''}
              businesses={businesses}
              onNewSearch={handleNewSearch}
            />
          </div>
        </main>
      )}
      <PublicFooter
        tagline="Find local detailing services"
        compact={hasSearched}
      />
    </div>
  );
};
