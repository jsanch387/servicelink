'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FEATURE_CAROUSEL_SLIDES,
  FEATURE_SECONDARY_CARDS,
  type FeatureCarouselSlide,
} from '../data/featuresSeoContent';

const SLIDE_MEDIA_WIDTH =
  'w-full max-w-[min(100%,340px)] sm:max-w-[380px] md:max-w-[420px]';

const CAROUSEL_ARROW_CLASS =
  'absolute top-[38%] z-10 flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-[var(--dashboard-bg)]/90 text-gray-300 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white';

function FeatureShowcaseSlide({
  slide,
  priority,
}: {
  slide: FeatureCarouselSlide;
  priority?: boolean;
}) {
  return (
    <article className="flex flex-col items-center px-1 sm:px-2">
      <header className="mb-5 sm:mb-6 text-center">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          {slide.name}
        </h3>
      </header>

      <figure
        className={`relative mx-auto ${SLIDE_MEDIA_WIDTH} aspect-[1284/2116] overflow-hidden`}
      >
        <Image
          src={slide.image}
          alt={slide.imageAlt}
          width={1284}
          height={2778}
          className="absolute inset-x-0 top-0 w-full h-auto -translate-y-[11.915%]"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
      </figure>

      <div className={`mt-8 mx-auto ${SLIDE_MEDIA_WIDTH} px-2 text-center`}>
        <p className="text-sm sm:text-[15px] font-medium text-gray-200 leading-snug">
          {slide.outcome}
        </p>
        <p className="mt-3 text-xs sm:text-sm text-gray-500 leading-relaxed">
          {slide.bullets.join(' · ')}
        </p>
      </div>
    </article>
  );
}

function FeatureSecondaryShowcase({
  feature,
}: {
  feature: (typeof FEATURE_SECONDARY_CARDS)[number];
}) {
  const Icon = feature.icon;

  return (
    <article
      id={feature.id}
      className="scroll-mt-28 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-gray-200">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {feature.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Also included</p>
        </div>
      </div>
      <ul className="space-y-2.5 text-left">
        {feature.bullets.map(bullet => (
          <li
            key={bullet}
            className="flex items-start gap-3 text-sm text-gray-400 leading-snug"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35"
              aria-hidden
            />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function FeaturesPageCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = FEATURE_CAROUSEL_SLIDES.length;

  const goToIndex = useCallback(
    (index: number) => {
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goToPrevious = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const goToNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const minSwipe = 48;

      if (Math.abs(dx) < minSwipe || Math.abs(dx) < Math.abs(dy) * 1.2) return;

      if (dx < 0) goToNext();
      else goToPrevious();
    };

    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchend', onTouchEnd);
    };
  }, [goToNext, goToPrevious]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="features-carousel-heading"
      className="mb-10 sm:mb-12"
    >
      <h2 id="features-carousel-heading" className="sr-only">
        ServiceLink product features
      </h2>

      <div className="relative max-w-[440px] sm:max-w-[480px] md:max-w-[520px] mx-auto px-10 sm:px-12 lg:px-14">
        <button
          type="button"
          onClick={goToPrevious}
          className={`${CAROUSEL_ARROW_CLASS} left-0 -translate-y-1/2`}
          aria-label="Previous feature"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={goToNext}
          className={`${CAROUSEL_ARROW_CLASS} right-0 -translate-y-1/2`}
          aria-label="Next feature"
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden />
        </button>

        {FEATURE_CAROUSEL_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            id={slide.id}
            className={
              index === activeIndex
                ? 'block animate-in fade-in duration-300'
                : 'hidden'
            }
            role="group"
            aria-roledescription="slide"
            aria-label={`${slide.name}, slide ${index + 1} of ${slideCount}`}
            aria-hidden={index !== activeIndex}
          >
            <FeatureShowcaseSlide slide={slide} priority={index === 0} />
          </div>
        ))}
      </div>

      <div
        className="mt-6 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Feature slides"
      >
        {FEATURE_CAROUSEL_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-label={`Go to slide ${index + 1}: ${slide.name}`}
            onClick={() => goToIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === index
                ? 'w-6 bg-white'
                : 'w-2 bg-white/25 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {FEATURE_SECONDARY_CARDS.length > 0 ? (
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
          {FEATURE_SECONDARY_CARDS.map(feature => (
            <FeatureSecondaryShowcase key={feature.id} feature={feature} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
