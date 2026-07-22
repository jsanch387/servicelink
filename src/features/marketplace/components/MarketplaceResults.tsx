'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { getPublicBusinessProfilePath } from '@/constants/routes';
import type { MarketplaceBusiness } from '../types/marketplace';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface MarketplaceResultsProps {
  location: string;
  businesses: MarketplaceBusiness[];
  onNewSearch: () => void;
}

const LOCATION_MODE_LABELS: Record<string, string> = {
  mobile_only: 'Mobile service',
  shop_only: 'Shop location',
  both: 'Mobile & shop',
};

function getBusinessInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join('');
}

export const MarketplaceResults: React.FC<MarketplaceResultsProps> = ({
  location,
  businesses,
  onNewSearch,
}) => {
  return (
    <div className="w-full animate-hero-float-in">
      <div className="mb-6 sm:mb-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSearch}
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          className="-ml-3 mb-4 text-white/55 hover:text-white sm:mb-6"
          aria-label={`Change search from ${location}`}
        >
          Another search
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
            {businesses.length}{' '}
            {businesses.length === 1 ? 'detailer' : 'detailers'} near {location}
          </h2>
        </div>
      </div>

      {businesses.length === 0 ? (
        <Card
          className="!rounded-2xl !border-white/[0.09] !bg-neutral-900 text-center"
          padding="lg"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <MapPinIcon className="h-5 w-5 text-white/45" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">
            No businesses found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
            We couldn&apos;t find any detailers in this area. Try another city
            or ZIP code.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewSearch}
            className="mt-6"
          >
            Try another search
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map(business => (
            <Link
              key={business.id}
              href={getPublicBusinessProfilePath(business.slug)}
              aria-label={`View and book ${business.name}`}
              className="group block h-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Card
                className="flex h-full min-h-[170px] flex-col overflow-hidden !rounded-2xl !border-white/[0.09] !bg-neutral-900 transition-all duration-300 group-hover:!border-white/20 group-hover:!bg-neutral-800/90 group-hover:shadow-xl group-hover:shadow-black/20"
                padding="sm"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-[1.2rem] bg-zinc-800/80 p-0.5 shadow-md ring-1 ring-white/10">
                    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[1rem] border border-neutral-900 bg-zinc-900">
                      {business.logoUrl ? (
                        <Image
                          src={business.logoUrl}
                          alt={`${business.name} logo`}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold tracking-[-0.03em] text-white/65">
                          {getBusinessInitials(business.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.025em] text-white">
                      {business.name}
                    </h3>
                    <p className="mt-1.5 text-xs font-medium text-white/60">
                      {LOCATION_MODE_LABELS[business.locationMode] ||
                        'Detailing service'}
                    </p>
                    <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-white/45">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{business.serviceArea}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-sm">
                  {business.rating ? (
                    <span className="flex items-center gap-1 text-white/70">
                      <StarIcon className="h-4 w-4 text-amber-400" />
                      <span className="font-semibold">{business.rating}</span>
                      <span className="text-white/35">
                        ({business.reviewCount})
                      </span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    Book now
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
