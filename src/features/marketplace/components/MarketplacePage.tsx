'use client';

import { PublicFooter } from '@/components/shared';
import { getFindDetailersCityPath, ROUTES } from '@/constants/routes';
import { searchMarketplace } from '../api/searchMarketplace';
import { matchMarketplaceCity } from '../config/marketplaceCities';
import type { MarketplaceBusiness } from '../types/marketplace';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { MarketplaceDiscovery } from './MarketplaceDiscovery';
import { MarketplaceHeader } from './MarketplaceHeader';
import { MarketplaceHero } from './MarketplaceHero';
import { MarketplaceMessCallouts } from './MarketplaceMessCallouts';
import { MarketplaceResults } from './MarketplaceResults';
import { MarketplaceSearch } from './MarketplaceSearch';
import { MarketplaceShowcase } from './MarketplaceShowcase';
import { MarketplaceTrustSignal } from './MarketplaceTrustSignal';

interface MarketplacePageProps {
  /** Prefill from a city SEO page or shared link. */
  initialLocation?: string;
  initialBusinesses?: MarketplaceBusiness[];
  /** When set, this page is a published city URL. */
  citySlug?: string;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  initialLocation = '',
  initialBusinesses = [],
  citySlug,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInitialResults = initialBusinesses.length > 0 || Boolean(citySlug);

  const [hasSearched, setHasSearched] = React.useState(hasInitialResults);
  const [locationQuery, setLocationQuery] = React.useState(
    initialLocation || ''
  );
  const [searchedLocation, setSearchedLocation] = React.useState(
    initialLocation || ''
  );
  const [businesses, setBusinesses] =
    React.useState<MarketplaceBusiness[]>(initialBusinesses);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const autoSearchedRef = React.useRef(false);

  const runClientSearch = React.useCallback(async (location: string) => {
    const nextLocation = location.trim();
    if (!nextLocation) return;

    // Switch to results layout immediately so skeletons can show while fetching.
    setIsSearching(true);
    setSearchError('');
    setHasSearched(true);
    setSearchedLocation(nextLocation);
    setBusinesses([]);

    try {
      const result = await searchMarketplace(nextLocation);
      setLocationQuery(result.location || nextLocation);
      setBusinesses(result.businesses);
      setSearchedLocation(result.location);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Unable to search businesses right now.'
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = async (location: string) => {
    const nextLocation = location.trim();
    if (!nextLocation) return;

    const matchedCity = matchMarketplaceCity(nextLocation);
    if (matchedCity && matchedCity.slug !== citySlug) {
      router.push(getFindDetailersCityPath(matchedCity.slug));
      return;
    }

    if (!matchedCity && citySlug) {
      router.push(
        `${ROUTES.FIND_DETAILERS}?location=${encodeURIComponent(nextLocation)}`
      );
      return;
    }

    await runClientSearch(nextLocation);
  };

  // Hub share links: /find-detailers?location=Austin,%20TX
  React.useEffect(() => {
    if (citySlug || autoSearchedRef.current) return;
    const locationParam = searchParams.get('location')?.trim();
    if (!locationParam) return;

    autoSearchedRef.current = true;
    const matchedCity = matchMarketplaceCity(locationParam);
    if (matchedCity) {
      router.replace(getFindDetailersCityPath(matchedCity.slug));
      return;
    }

    setLocationQuery(locationParam);
    void runClientSearch(locationParam);
  }, [citySlug, router, runClientSearch, searchParams]);

  const search = (
    <MarketplaceSearch
      location={locationQuery}
      onLocationChange={setLocationQuery}
      onSearch={handleSearch}
      isSearching={isSearching}
      searchError={searchError}
      compact={hasSearched}
    />
  );

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
              {search}
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
          <div className="relative mx-auto max-w-6xl space-y-8 sm:space-y-10">
            <div className="relative z-30 flex justify-center">{search}</div>
            <div className="relative z-0">
              <MarketplaceResults
                location={searchedLocation || locationQuery}
                businesses={businesses}
                isSearching={isSearching}
              />
            </div>
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
