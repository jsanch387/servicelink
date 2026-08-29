'use client';

import { ROUTES } from '@/constants/routes';
import {
  BellAlertIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { LANDING_HOW_IT_WORKS } from '../data/landingHowItWorks';
import { LandingSignupCta } from './LandingSignupCta';

const ICONS = [LinkIcon, CalendarDaysIcon, BellAlertIcon, CurrencyDollarIcon];
const STEP_HOLD_MS = 900;
const LINE_MS = 700;
const LOOP_PAUSE_MS = 1400;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}

function useHowItWorksSequence(enabled: boolean) {
  const [active, setActive] = useState(0);
  const [filledLines, setFilledLines] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setActive(0);
      setFilledLines(0);
      return;
    }

    let step = 0;
    let phase: 'hold' | 'line' | 'pause' = 'hold';
    setActive(0);
    setFilledLines(0);

    const tick = () => {
      if (phase === 'hold') {
        if (step < LANDING_HOW_IT_WORKS.length - 1) {
          setFilledLines(step + 1);
          phase = 'line';
          return LINE_MS;
        }
        phase = 'pause';
        return LOOP_PAUSE_MS;
      }

      if (phase === 'line') {
        step += 1;
        setActive(step);
        phase = 'hold';
        return STEP_HOLD_MS;
      }

      step = 0;
      setActive(0);
      setFilledLines(0);
      phase = 'hold';
      return STEP_HOLD_MS;
    };

    let id = window.setTimeout(function loop() {
      const delay = tick();
      id = window.setTimeout(loop, delay);
    }, STEP_HOLD_MS);

    return () => window.clearTimeout(id);
  }, [enabled]);

  return { active, filledLines };
}

function StepConnector({
  filled,
  filling,
  axis,
}: {
  filled: boolean;
  filling: boolean;
  axis: 'x' | 'y';
}) {
  const fillClass =
    axis === 'x'
      ? 'absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-white/80 via-white to-white/70'
      : 'absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-white/80 via-white to-white/70';
  const sparkClass =
    axis === 'x'
      ? 'absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]'
      : 'absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]';

  return (
    <span
      className={
        axis === 'x'
          ? 'pointer-events-none absolute left-[calc(50%+28px)] right-[-50%] top-5 hidden h-[2px] sm:block'
          : 'pointer-events-none absolute bottom-0 left-[21px] top-11 w-[2px] sm:hidden'
      }
      aria-hidden
    >
      <span
        className={`absolute inset-0 ${
          axis === 'x'
            ? 'border-t border-dashed border-white/15'
            : 'border-l border-dashed border-white/15'
        }`}
      />
      {filled ? (
        <span
          className={`${fillClass} ${
            filling
              ? axis === 'x'
                ? 'animate-how-it-works-line-fill'
                : 'animate-how-it-works-line-fill-y'
              : ''
          }`}
        />
      ) : null}
      {filling ? (
        <span
          className={`${sparkClass} ${
            axis === 'x'
              ? 'animate-how-it-works-spark'
              : 'animate-how-it-works-spark-y'
          }`}
        />
      ) : null}
    </span>
  );
}

export function LandingHowItWorksSteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const { active, filledLines } = useHowItWorksSequence(
    inView && !reduceMotion
  );

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.28);
      },
      { threshold: [0.28, 0.5] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={ROUTES.HOW_IT_WORKS.slice(1)}
      className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="how-it-works-heading"
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          From first click to paid job.
        </h2>
        <p className="mt-2 text-lg text-zinc-400">
          Better for customers. More control for you.
        </p>
      </div>
      <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-0 sm:grid-cols-4 sm:gap-4">
        {LANDING_HOW_IT_WORKS.map((step, index) => {
          const Icon = ICONS[index];
          const isActive = reduceMotion || active === index;
          const isLit = reduceMotion || index <= active;
          const lineFilled = reduceMotion || index < filledLines;
          const lineFilling = !reduceMotion && filledLines === index + 1;
          const showLine = index < LANDING_HOW_IT_WORKS.length - 1;

          return (
            <li
              key={step.id}
              className="relative flex gap-4 pb-8 last:pb-0 sm:block sm:pb-0 sm:text-center"
            >
              {showLine ? (
                <>
                  <StepConnector
                    filled={lineFilled}
                    filling={lineFilling}
                    axis="x"
                  />
                  <StepConnector
                    filled={lineFilled}
                    filling={lineFilling}
                    axis="y"
                  />
                </>
              ) : null}
              <div
                className={`relative z-[1] mx-0 mb-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-[#141416] transition-all duration-500 sm:mx-auto sm:mb-3 ${
                  isActive
                    ? '-translate-y-1 scale-110 border-white/55 text-white animate-how-it-works-step-glow'
                    : isLit
                      ? 'border-white/30 text-white'
                      : 'border-white/15 text-white/40'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 pt-1.5 sm:pt-0">
                <p
                  className={`text-[15px] font-semibold transition-colors duration-500 ${
                    isLit ? 'text-white' : 'text-white/45'
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`mt-1 text-sm transition-colors duration-500 ${
                    isLit ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  {step.line}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-10 sm:mt-12">
        <LandingSignupCta label="Get your link" />
      </div>
    </section>
  );
}
