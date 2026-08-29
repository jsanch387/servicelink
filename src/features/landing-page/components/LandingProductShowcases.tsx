import React from 'react';
import { LANDING_PRODUCT_SHOWCASES } from '../data/landingProductShowcases';
import { ProductScreenshotFrame } from './ProductScreenshotFrame';

export function LandingProductShowcases() {
  return (
    <section
      id="features"
      className="px-4 py-16 sm:px-6 sm:py-20"
      aria-label="What you get"
    >
      <div className="mx-auto max-w-6xl space-y-16 sm:space-y-24">
        {LANDING_PRODUCT_SHOWCASES.map((showcase, index) => {
          const imageOnRight = index % 2 === 0;
          return (
            <article
              key={showcase.id}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div className={imageOnRight ? 'lg:order-1' : 'lg:order-2'}>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {showcase.headline}
                </h2>
                <p className="mt-2 text-lg text-zinc-400">{showcase.line}</p>
              </div>
              <div
                className={`mx-auto w-full ${
                  showcase.frame === 'phone'
                    ? 'max-w-[280px] sm:max-w-[300px]'
                    : 'max-w-xl'
                } ${imageOnRight ? 'lg:order-2' : 'lg:order-1'}`}
              >
                <ProductScreenshotFrame
                  frame={showcase.frame}
                  image={showcase.image}
                  imageAlt={showcase.imageAlt}
                  mock={showcase.mock}
                  placeholderLabel={showcase.placeholderLabel}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
