'use client';

import { GlassCard } from '@/components/shared';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

import {
  WORKSHOP_OFFER,
  WORKSHOP_TESTIMONIALS,
  type WorkshopTestimonial,
} from '../data/workshopWatchContent';

const AUTO_ADVANCE_MS = 5000;

function StarRating() {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
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

function TestimonialCard({ item }: { item: WorkshopTestimonial }) {
  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      className="p-4 sm:p-5 flex flex-col h-full w-full"
    >
      <StarRating />
      <blockquote className="mt-3 text-sm text-gray-300 leading-relaxed flex-1">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <footer className="mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-400"
          aria-hidden
        >
          {item.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.name}</p>
          <p className="text-xs text-gray-500 truncate">{item.business}</p>
        </div>
      </footer>
    </GlassCard>
  );
}

function WorkshopTestimonialCarousel() {
  const count = WORKSHOP_TESTIMONIALS.length;
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [goNext, reduceMotion]);

  return (
    <div className="sm:hidden px-1">
      <div
        className="relative"
        aria-roledescription="carousel"
        aria-label="Detailer reviews"
      >
        <div className="overflow-hidden">
          <div
            className={`flex ${
              reduceMotion ? '' : 'transition-transform duration-500 ease-out'
            }`}
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {WORKSHOP_TESTIMONIALS.map((item, index) => (
              <div
                key={item.id}
                className="w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                aria-hidden={index !== active}
              >
                <TestimonialCard item={item} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[var(--dashboard-bg)]/95 text-white shadow-lg backdrop-blur-sm"
          aria-label="Previous review"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[var(--dashboard-bg)]/95 text-white shadow-lg backdrop-blur-sm"
          aria-label="Next review"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Choose a review"
      >
        {WORKSHOP_TESTIMONIALS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Review ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === active
                ? 'w-6 bg-white'
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function AdsWorkshopSocialProof() {
  return (
    <section aria-labelledby="workshop-social-heading" className="space-y-4">
      <header className="text-center">
        <h2
          id="workshop-social-heading"
          className="text-lg sm:text-xl font-bold text-white"
        >
          Detailers putting the playbook to work
        </h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          {WORKSHOP_OFFER.socialProofNote}
        </p>
      </header>

      <WorkshopTestimonialCarousel />

      <div className="hidden sm:grid sm:grid-cols-3 gap-4">
        {WORKSHOP_TESTIMONIALS.map(item => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
