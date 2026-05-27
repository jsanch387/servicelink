'use client';

import { GlassCard } from '@/components/shared';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useState } from 'react';
import {
  AUTOMATION_BOOKING_LINK_TIP,
  AUTOMATION_CAROUSEL_BACK,
  AUTOMATION_CAROUSEL_NEXT,
  AUTOMATION_CONNECT_SLIDE_LEAD,
  AUTOMATION_CONNECT_SLIDE_TITLE,
  AUTOMATION_INTRO_SLIDES,
  AUTOMATION_SETUP_CTA_CONNECT,
  AUTOMATION_SETUP_FOOTNOTE,
} from '../automationCopy';
import { AutomationDmThread } from './AutomationDmThread';

export type AutomationIntroCarouselProps = {
  hasBookingLink: boolean;
  connectLoading: boolean;
  connectError: string | null;
  onConnect: () => void;
};

function slideMinHeight(kind: string | undefined): string {
  if (kind === 'demo') return 'min-h-[16.5rem] sm:min-h-[15.5rem]';
  return 'min-h-[9.5rem] sm:min-h-[8.75rem]';
}

export const AutomationIntroCarousel: React.FC<
  AutomationIntroCarouselProps
> = ({ hasBookingLink, connectLoading, connectError, onConnect }) => {
  const introCount = AUTOMATION_INTRO_SLIDES.length;
  const totalSlides = introCount + 1;
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const isConnectSlide = active === introCount;
  const isFirst = active === 0;
  const progress = ((active + 1) / totalSlides) * 100;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > active ? 'forward' : 'back');
      setActive(Math.min(Math.max(index, 0), totalSlides - 1));
    },
    [active, totalSlides]
  );

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  const slide = isConnectSlide ? null : AUTOMATION_INTRO_SLIDES[active];
  const slideAnimation =
    direction === 'forward'
      ? 'animate-in fade-in slide-in-from-right-3 duration-300'
      : 'animate-in fade-in slide-in-from-left-3 duration-300';

  return (
    <GlassCard
      padding="lg"
      rounded="rounded-2xl"
      className="border-white/[0.09] bg-white/[0.025]"
    >
      <div
        aria-roledescription="carousel"
        aria-label="How Instagram DM replies work"
      >
        <div className="mb-4 flex items-center justify-between gap-4 text-[11px] text-gray-500">
          <span className="tabular-nums">
            {active + 1} / {totalSlides}
          </span>
          <div className="h-1 flex-1 max-w-[12rem] overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={`${slideMinHeight(slide?.kind)} text-left`}>
          {isConnectSlide ? (
            <div key="connect" className={slideAnimation}>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {AUTOMATION_CONNECT_SLIDE_TITLE}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
                {AUTOMATION_CONNECT_SLIDE_LEAD}
              </p>
              <div className="mx-auto mt-4 flex h-15 w-15 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 sm:h-14 sm:w-14">
                <ChatBubbleLeftRightIcon
                  className="h-6 w-6 text-emerald-300 sm:h-7 sm:w-7"
                  aria-hidden
                />
              </div>
              {!hasBookingLink ? (
                <p className="mx-auto mt-4 max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-3.5 py-2.5 text-left text-sm leading-snug text-amber-100/90">
                  {AUTOMATION_BOOKING_LINK_TIP}
                </p>
              ) : null}
            </div>
          ) : slide ? (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${active + 1} of ${totalSlides}`}
              className={slideAnimation}
            >
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {slide.title}
              </h2>
              {slide.subtitle ? (
                <p
                  className={`mt-1.5 max-w-sm text-sm leading-relaxed ${
                    slide.id === 'pain'
                      ? 'inline-flex w-fit max-w-[16rem] rounded-2xl rounded-tl-md border border-white/[0.08] bg-neutral-800/70 px-3 py-2 text-gray-200'
                      : 'text-gray-400'
                  }`}
                >
                  {slide.subtitle}
                </p>
              ) : null}

              {slide.kind === 'demo' && slide.demoMessages ? (
                <div className="mx-auto mt-0.5 max-w-sm">
                  <AutomationDmThread
                    messages={slide.demoMessages}
                    outcome={slide.demoOutcome}
                  />
                </div>
              ) : slide.lines ? (
                <ul className="mt-3.5 max-w-sm space-y-2.5">
                  {slide.lines.map(line => (
                    <li
                      key={line}
                      className="flex gap-3 text-sm leading-relaxed text-gray-400"
                    >
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400/90"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              className={`rounded-full transition-all duration-300 ${
                index === active
                  ? 'h-2 w-7 bg-emerald-400'
                  : 'h-1.5 w-1.5 bg-neutral-600 hover:bg-neutral-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst || connectLoading}
            className={`inline-flex items-center gap-1 text-sm transition-colors ${
              isFirst || connectLoading
                ? 'cursor-not-allowed text-gray-600'
                : 'cursor-pointer text-gray-300 hover:text-white'
            }`}
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            {AUTOMATION_CAROUSEL_BACK}
          </button>

          {isConnectSlide ? (
            <button
              type="button"
              onClick={onConnect}
              disabled={connectLoading}
              className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                connectLoading
                  ? 'cursor-not-allowed text-gray-500'
                  : 'cursor-pointer text-emerald-300 hover:text-emerald-200'
              }`}
            >
              {AUTOMATION_SETUP_CTA_CONNECT}
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
            >
              {AUTOMATION_CAROUSEL_NEXT}
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {connectError && isConnectSlide ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {connectError}
          </p>
        ) : null}

        {isConnectSlide ? (
          <p className="mt-4 max-w-sm text-xs leading-snug text-gray-600">
            {AUTOMATION_SETUP_FOOTNOTE}
          </p>
        ) : null}
      </div>
    </GlassCard>
  );
};
