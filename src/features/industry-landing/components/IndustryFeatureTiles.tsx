import type { ReactNode } from 'react';
import type { IndustryLandingContent, IndustryFeatureTile } from '../types';
import {
  BookingPackagesScreen,
  DepositCheckoutScreen,
  VehicleSizeScreen,
} from './visuals/bookingScreens';
import { BrowserDeviceFrame } from './visuals/BrowserDeviceFrame';
import {
  CrmDesktopScreen,
  OwnerJobsScreen,
  SmsThreadScreen,
} from './visuals/ownerScreens';
import { PhoneDeviceFrame } from './visuals/PhoneDeviceFrame';

function FeatureCopy({ tile }: { tile: IndustryFeatureTile }) {
  return (
    <div className="max-w-md">
      <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
        {tile.title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
        {tile.line}
      </p>
    </div>
  );
}

function BookingShowcase({ tile }: { tile: IndustryFeatureTile }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <FeatureCopy tile={tile} />
      <div>
        <div className="sm:hidden">
          <PhoneDeviceFrame
            size="md"
            screenshotSrc={tile.screenshotSrc}
            screenshotAlt={tile.screenshotAlt}
          >
            <VehicleSizeScreen />
          </PhoneDeviceFrame>
        </div>
        <div className="hidden sm:block">
          <BrowserDeviceFrame
            screenshotSrc={tile.screenshotSrc}
            screenshotAlt={tile.screenshotAlt}
          >
            <div className="mx-auto max-w-lg py-1">
              <BookingPackagesScreen compact={false} />
            </div>
          </BrowserDeviceFrame>
        </div>
      </div>
    </div>
  );
}

function PhoneShowcase({
  tile,
  children,
  reverse = false,
}: {
  tile: IndustryFeatureTile;
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        reverse ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      <FeatureCopy tile={tile} />
      <PhoneDeviceFrame
        size="md"
        screenshotSrc={tile.screenshotSrc}
        screenshotAlt={tile.screenshotAlt}
      >
        {children}
      </PhoneDeviceFrame>
    </div>
  );
}

function CrmShowcase({ tile }: { tile: IndustryFeatureTile }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <FeatureCopy tile={tile} />
      <BrowserDeviceFrame
        screenshotSrc={tile.screenshotSrc}
        screenshotAlt={tile.screenshotAlt}
        url="myservicelink.app"
      >
        <CrmDesktopScreen />
      </BrowserDeviceFrame>
    </div>
  );
}

export function IndustryFeatureTiles({
  content,
}: {
  content: IndustryLandingContent;
}) {
  const byId = Object.fromEntries(
    content.features.tiles.map(tile => [tile.id, tile])
  ) as Record<string, IndustryFeatureTile>;

  const booking = byId.booking;
  const deposits = byId.deposits;
  const crm = byId.crm;
  const sms = byId.sms;
  const app = byId.app;

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.features.heading}
        </h2>
        <div className="mt-16 space-y-24 sm:mt-20 sm:space-y-28">
          {booking ? <BookingShowcase tile={booking} /> : null}
          {deposits ? (
            <PhoneShowcase tile={deposits} reverse>
              <DepositCheckoutScreen />
            </PhoneShowcase>
          ) : null}
          {crm ? <CrmShowcase tile={crm} /> : null}
          {sms ? (
            <PhoneShowcase tile={sms}>
              <SmsThreadScreen />
            </PhoneShowcase>
          ) : null}
          {app ? (
            <PhoneShowcase tile={app} reverse>
              <OwnerJobsScreen />
            </PhoneShowcase>
          ) : null}
        </div>
      </div>
    </section>
  );
}
