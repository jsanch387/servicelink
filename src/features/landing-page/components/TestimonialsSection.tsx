'use client';

import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { GlassCard } from '@/components/shared';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  LANDING_TESTIMONIALS,
  type LandingTestimonial,
} from '../data/landingTestimonials';

function AppStoreReviewBadge() {
  return (
    <a
      href={IOS_APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300 transition-colors hover:border-white/20 hover:text-white"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3 fill-current">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      App Store
    </a>
  );
}

function StarRating() {
  return (
    <div
      className="flex flex-shrink-0 gap-px text-amber-400"
      aria-label="5 star rating"
    >
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="h-3.5 w-3.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const COLLAPSED_CARD_HEIGHT_CLASS = 'h-[263px]';

function TestimonialCard({
  testimonial,
  expanded,
  onToggle,
}: {
  testimonial: LandingTestimonial;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, testimonial.content]);

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      showBlur={false}
      className="flex h-full flex-col !border-white/15 !bg-white/[0.10]"
    >
      <div className="flex h-full flex-col px-5 py-4">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <AppStoreReviewBadge />
          <StarRating />
        </div>
        <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug text-white">
          {testimonial.title}
        </p>
        <p
          ref={textRef}
          className={`mt-2 text-[13px] leading-relaxed text-zinc-300 ${
            expanded ? '' : 'line-clamp-3 min-h-[3.9rem] flex-1'
          }`}
        >
          {testimonial.content}
        </p>
        <div className="mt-1.5 flex min-h-5 shrink-0 items-center">
          {canExpand ? (
            <button
              type="button"
              onClick={onToggle}
              className="cursor-pointer text-[12px] font-medium text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : 'See more'}
            </button>
          ) : null}
        </div>
        <div className="mt-auto flex shrink-0 items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-zinc-200">
            {testimonial.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">
              {testimonial.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-400">
              App Store · {testimonial.date}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

const ARROW_CLASS =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-gray-300 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30';

function TestimonialsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const lastIndex = LANDING_TESTIMONIALS.length - 1;

  const syncActiveIndex = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const slides = root.querySelectorAll<HTMLElement>(
      '[data-testimonial-slide]'
    );
    const rootLeft = root.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, index) => {
      const dist = Math.abs(slide.getBoundingClientRect().left - rootLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    setActiveIndex(best);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const root = scrollRef.current;
    const slide = root?.querySelector<HTMLElement>(
      `[data-testimonial-slide="${index}"]`
    );
    if (!root || !slide) return;
    const left =
      slide.getBoundingClientRect().left -
      root.getBoundingClientRect().left +
      root.scrollLeft;
    root.scrollTo({ left, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={syncActiveIndex}
        className="scrollbar-hide flex items-start snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [scrollbar-width:none]"
        aria-label="App Store reviews"
        aria-roledescription="carousel"
      >
        {LANDING_TESTIMONIALS.map((testimonial, index) => {
          const expanded = expandedId === testimonial.id;
          return (
            <div
              key={testimonial.id}
              data-testimonial-slide={index}
              className={`flex w-[min(300px,82vw)] shrink-0 snap-start sm:w-[320px] ${
                expanded ? '' : COLLAPSED_CARD_HEIGHT_CLASS
              }`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Review ${index + 1} of ${LANDING_TESTIMONIALS.length}`}
            >
              <TestimonialCard
                testimonial={testimonial}
                expanded={expanded}
                onToggle={() =>
                  setExpandedId(current =>
                    current === testimonial.id ? null : testimonial.id
                  )
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          className={ARROW_CLASS}
          aria-label="Previous review"
          disabled={activeIndex === 0}
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Review navigation"
        >
          {LANDING_TESTIMONIALS.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`Go to review ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'w-5 bg-white'
                  : 'w-1.5 bg-white/25 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          className={ARROW_CLASS}
          aria-label="Next review"
          disabled={activeIndex === lastIndex}
          onClick={() => scrollToIndex(Math.min(lastIndex, activeIndex + 1))}
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export const TestimonialsSection: React.FC = () => {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Reviews.
          </h2>
          <p className="mt-1.5 text-base text-zinc-400">From the App Store.</p>
        </header>
        <TestimonialsCarousel />
      </div>
    </section>
  );
};
