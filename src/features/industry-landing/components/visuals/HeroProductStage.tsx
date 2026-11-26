import React from 'react';
import { BookingPackagesScreen, BookingSlotsScreen } from './bookingScreens';
import { BrowserDeviceFrame } from './BrowserDeviceFrame';
import { PhoneDeviceFrame } from './PhoneDeviceFrame';

/** TwoBucket-style laptop + phone: real booking page in both frames. */
export function HeroProductStage() {
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-transparent px-4 pb-8 pt-8 sm:px-10 sm:pt-10 md:pb-0">
      <div className="relative hidden md:block">
        <BrowserDeviceFrame>
          <div className="mx-auto max-w-xl py-2">
            <BookingPackagesScreen compact={false} />
          </div>
        </BrowserDeviceFrame>
        <div
          className="pointer-events-none absolute inset-x-2 bottom-2 h-24 rounded-b-xl bg-gradient-to-t from-[#141416] to-transparent"
          aria-hidden
        />
      </div>
      <div className="md:absolute md:bottom-0 md:right-8 md:w-[240px] lg:right-12 lg:w-[260px]">
        <PhoneDeviceFrame size="lg" float className="md:max-w-none">
          <BookingSlotsScreen />
        </PhoneDeviceFrame>
      </div>
    </div>
  );
}
