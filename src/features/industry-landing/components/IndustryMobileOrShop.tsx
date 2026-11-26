import type { IndustryLandingContent } from '../types';
import {
  ServiceAreaLocationScreen,
  ShopAddressLocationScreen,
} from './visuals/bookingScreens';
import { PhoneDeviceFrame } from './visuals/PhoneDeviceFrame';

export function IndustryMobileOrShop({
  content,
}: {
  content: IndustryLandingContent;
}) {
  const { mobileOrShop } = content;
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 md:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {mobileOrShop.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-zinc-400">
          {mobileOrShop.sub}
        </p>
        <div className="mt-14 grid gap-12 sm:mt-16 md:grid-cols-2 md:gap-10">
          <article className="flex flex-col items-center text-center">
            <PhoneDeviceFrame size="md">
              <ServiceAreaLocationScreen />
            </PhoneDeviceFrame>
            <h3 className="mt-8 text-lg font-semibold tracking-tight text-white">
              {mobileOrShop.mobile.title}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
              {mobileOrShop.mobile.line}
            </p>
          </article>
          <article className="flex flex-col items-center text-center">
            <PhoneDeviceFrame size="md">
              <ShopAddressLocationScreen />
            </PhoneDeviceFrame>
            <h3 className="mt-8 text-lg font-semibold tracking-tight text-white">
              {mobileOrShop.shop.title}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
              {mobileOrShop.shop.line}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
