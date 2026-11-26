import type { IndustryLandingContent } from '../types';
import {
  ServiceAreaVisual,
  ShopAddressVisual,
} from './visuals/ServiceAreaVsShopVisual';

export function IndustryMobileOrShop({
  content,
}: {
  content: IndustryLandingContent;
}) {
  const { mobileOrShop } = content;
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {mobileOrShop.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-zinc-400">
          {mobileOrShop.sub}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <ServiceAreaVisual />
            <h3 className="mt-5 text-lg font-semibold text-white">
              {mobileOrShop.mobile.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {mobileOrShop.mobile.line}
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <ShopAddressVisual />
            <h3 className="mt-5 text-lg font-semibold text-white">
              {mobileOrShop.shop.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {mobileOrShop.shop.line}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
