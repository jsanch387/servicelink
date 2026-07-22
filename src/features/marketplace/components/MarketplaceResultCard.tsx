'use client';

import {
  ArrowRightIcon,
  MapPinIcon,
  PhotoIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { Card } from '@/components/shared/Card';
import { getPublicBusinessProfilePath } from '@/constants/routes';
import type { MarketplaceBusiness } from '../types/marketplace';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const LOCATION_MODE_LABELS: Record<string, string> = {
  mobile_only: 'Comes to you',
  shop_only: 'In-shop',
  both: 'Mobile & shop',
};

/** Prefer up to three real photos; never pad with empty slots. */
const MAX_PORTFOLIO_PHOTOS = 3;

const PHOTO_GRID_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

function getBusinessInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join('');
}

/**
 * Gallery first, then banner/logo as fallbacks.
 * Returns 0–3 URLs so the strip can split evenly (full / half / thirds).
 */
export function portfolioPhotosFor(business: MarketplaceBusiness): string[] {
  const urls = [...business.portfolioUrls];
  if (business.bannerUrl && !urls.includes(business.bannerUrl)) {
    urls.push(business.bannerUrl);
  }
  if (business.logoUrl && !urls.includes(business.logoUrl)) {
    urls.push(business.logoUrl);
  }
  return urls.filter(Boolean).slice(0, MAX_PORTFOLIO_PHOTOS);
}

function formatStartingPrice(priceCents: number): string {
  const dollars = Math.round(priceCents / 100);
  return `From $${dollars.toLocaleString()}`;
}

function lowestPricedService(business: MarketplaceBusiness) {
  if (business.services.length === 0) return null;
  return business.services.reduce((lowest, service) =>
    service.priceCents < lowest.priceCents ? service : lowest
  );
}

function portfolioImageSizes(photoCount: number): string {
  if (photoCount <= 1) {
    return '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 360px';
  }
  if (photoCount === 2) {
    return '(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 180px';
  }
  return '(max-width: 640px) 33vw, (max-width: 1280px) 16vw, 120px';
}

interface MarketplaceResultCardProps {
  business: MarketplaceBusiness;
  /** Eager-load the first photo when this card is above the fold. */
  priority?: boolean;
}

export function MarketplaceResultCard({
  business,
  priority = false,
}: MarketplaceResultCardProps) {
  const photos = portfolioPhotosFor(business);
  const photoCount = Math.min(
    Math.max(photos.length, 1),
    MAX_PORTFOLIO_PHOTOS
  ) as 1 | 2 | 3;
  const startingService = lowestPricedService(business);
  const modeLabel = LOCATION_MODE_LABELS[business.locationMode];
  const imageSizes = portfolioImageSizes(photos.length);

  return (
    <Link
      href={getPublicBusinessProfilePath(business.slug)}
      aria-label={`View and book ${business.name}`}
      className="group block h-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <Card
        className="flex h-full flex-col overflow-hidden !rounded-2xl !border-white/[0.09] !bg-neutral-900 !p-0 transition-all duration-300 group-hover:!border-white/20 group-hover:!bg-neutral-800/90 group-hover:shadow-xl group-hover:shadow-black/20"
        padding="sm"
      >
        <div
          className={`relative grid h-36 gap-0.5 overflow-hidden bg-neutral-950 sm:h-40 ${PHOTO_GRID_CLASS[photoCount]}`}
        >
          {photos.length > 0 ? (
            photos.map((src, index) => (
              <div
                key={`${business.id}-photo-${index}`}
                className="relative overflow-hidden bg-zinc-900"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes={imageSizes}
                  quality={75}
                  priority={priority && index === 0}
                  loading={priority && index === 0 ? 'eager' : 'lazy'}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/15">
              <PhotoIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt=""
                  fill
                  sizes="44px"
                  quality={75}
                  loading="lazy"
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-semibold tracking-[-0.03em] text-white/65">
                  {getBusinessInitials(business.name)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h3 className="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-snug tracking-[-0.025em] text-white">
                  {business.name}
                </h3>
                {business.rating ? (
                  <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-xs text-white/70">
                    <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold">{business.rating}</span>
                    <span className="text-[11px] text-white/35">
                      ({business.reviewCount})
                    </span>
                  </span>
                ) : null}
              </div>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-white/45">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{business.serviceArea}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-white/[0.08] pt-3.5">
            {modeLabel ? (
              <p className="text-[11px] font-medium tracking-wide text-white/45">
                {modeLabel}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-white/55">
                {startingService
                  ? formatStartingPrice(startingService.priceCents)
                  : '\u00a0'}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white">
                View
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
