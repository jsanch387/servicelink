import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {
  LANDING_LIVE_SHOPS,
  landingLiveShopHref,
  type LandingLiveShop,
} from '../data/landingLiveShops';

const LOOPED_LIVE_SHOPS = [...LANDING_LIVE_SHOPS, ...LANDING_LIVE_SHOPS];

function LiveShopCard({
  shop,
  hiddenForScreenReaders,
}: {
  shop: LandingLiveShop;
  hiddenForScreenReaders?: boolean;
}) {
  return (
    <Link
      href={landingLiveShopHref(shop.slug)}
      className="group w-[230px] shrink-0 cursor-pointer text-center sm:w-[260px] lg:w-[280px]"
      tabIndex={hiddenForScreenReaders ? -1 : undefined}
      aria-hidden={hiddenForScreenReaders || undefined}
    >
      <div className="relative h-[344px] overflow-hidden sm:h-[384px] lg:h-[414px]">
        <Image
          src={shop.image}
          alt={hiddenForScreenReaders ? '' : `${shop.name} booking page`}
          width={440}
          height={908}
          unoptimized
          className="pointer-events-none h-auto w-full"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--dashboard-bg)] to-transparent"
          aria-hidden
        />
      </div>
      <p className="mt-3.5 text-sm font-medium text-white">{shop.name}</p>
      <p className="text-xs text-zinc-500 transition-colors group-hover:text-zinc-300">
        {shop.city}
      </p>
    </Link>
  );
}

export function LandingLiveShopsMarquee() {
  return (
    <div
      className="relative overflow-hidden"
      aria-label="Live shop booking pages"
    >
      <div className="flex w-max gap-12 px-6 animate-marquee-shops hover:[animation-play-state:paused] motion-reduce:hidden sm:gap-16 sm:px-10 lg:gap-20">
        {LOOPED_LIVE_SHOPS.map((shop, index) => (
          <LiveShopCard
            key={`${shop.slug}-${index}`}
            shop={shop}
            hiddenForScreenReaders={index >= LANDING_LIVE_SHOPS.length}
          />
        ))}
      </div>

      <div className="hidden flex-wrap justify-center gap-12 px-6 motion-reduce:flex sm:gap-16 sm:px-10 lg:gap-20">
        {LANDING_LIVE_SHOPS.map(shop => (
          <LiveShopCard key={shop.slug} shop={shop} />
        ))}
      </div>
    </div>
  );
}

export function LandingLiveShopsSection() {
  return <LandingLiveShopsMarquee />;
}
