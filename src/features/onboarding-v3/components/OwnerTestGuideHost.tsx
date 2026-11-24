'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  dismissOwnerTestGuide,
  OWNER_TEST_PRACTICE_PARAM,
  startOwnerTestGuide,
  useOwnerTestGuidePhase,
} from '../ownerTestGuide';

const SELECTOR: Record<string, string> = {
  public: '[data-owner-test-guide="step"]',
  nav: '[data-owner-test-guide="nav"]',
  job: '[data-owner-test-guide="job"]',
  complete: '[data-owner-test-guide="complete"]',
};

function findTarget(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

function isOnScreen(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > 8 &&
    rect.bottom > 8 &&
    rect.left < window.innerWidth - 8 &&
    rect.top < window.innerHeight - 8
  );
}

function comfortablyVisible(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  return rect.top >= 72 && rect.bottom <= window.innerHeight - 16;
}

function scrollTargetIntoBand(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  const offscreen = rect.bottom < 72 || rect.top > window.innerHeight - 16;
  if (!offscreen) return false;
  node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}

type GuideTip = {
  key: string;
  copy: string;
  top: number;
  left: number;
  placeAbove: boolean;
  caret: number;
};

function measureTip(node: HTMLElement, key: string): GuideTip | null {
  const copy = node.getAttribute('data-owner-test-copy') ?? '';
  if (!copy) return null;
  const rect = node.getBoundingClientRect();
  const placeAbove = rect.top > 88;
  const width = 240;
  const center = rect.left + rect.width / 2;
  let left = center - width / 2;
  left = Math.min(Math.max(16, left), window.innerWidth - width - 16);
  const caret = Math.min(width - 22, Math.max(12, center - left - 5));
  return {
    key,
    copy,
    top: placeAbove ? rect.top - 10 : rect.bottom + 10,
    left,
    placeAbove,
    caret,
  };
}

export function OwnerTestGuideHost() {
  const phase = useOwnerTestGuidePhase();
  const [tips, setTips] = useState<GuideTip[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(OWNER_TEST_PRACTICE_PARAM) !== '1') return;
    startOwnerTestGuide();
    url.searchParams.delete(OWNER_TEST_PRACTICE_PARAM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', next);
  }, []);

  useEffect(() => {
    if (!phase) {
      setTips([]);
      return;
    }
    const selector = SELECTOR[phase];
    let cancelled = false;
    let scrolls = 0;

    const place = (allowScroll: boolean) => {
      if (cancelled) return;
      const rawPrimary = findTarget(selector);
      const rawNav =
        phase === 'nav'
          ? rawPrimary
          : findTarget('[data-owner-test-guide="nav"]');
      // Closed mobile menu keeps the link in the DOM, just off the screen.
      const nav = rawNav && isOnScreen(rawNav) ? rawNav : null;
      const primary = selector.endsWith('"nav"]') ? nav : rawPrimary;
      if (
        allowScroll &&
        primary &&
        primary !== nav &&
        scrolls < 4 &&
        !comfortablyVisible(primary) &&
        scrollTargetIntoBand(primary)
      ) {
        scrolls += 1;
        window.setTimeout(() => place(true), 80);
        return;
      }
      const next = [
        primary ? measureTip(primary, 'step') : null,
        nav && nav !== primary ? measureTip(nav, 'nav') : null,
      ].filter((tip): tip is GuideTip => tip != null);
      setTips(next);
    };

    const timers = [300, 800, 1400].map(ms =>
      window.setTimeout(() => place(true), ms)
    );
    let menuTimer = 0;
    const observer = new MutationObserver(() => {
      place(false);
      window.clearTimeout(menuTimer);
      menuTimer = window.setTimeout(() => place(false), 320);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-owner-test-guide'],
    });
    const onScroll = () => place(false);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      cancelled = true;
      timers.forEach(id => window.clearTimeout(id));
      window.clearTimeout(menuTimer);
      observer.disconnect();
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [phase]);

  if (!phase || tips.length === 0) return null;

  return createPortal(
    <>
      {tips.map(tip => (
        <div
          key={tip.key}
          className="pointer-events-none fixed z-[120] w-[240px]"
          style={{
            top: tip.top,
            left: tip.left,
            transform: tip.placeAbove ? 'translateY(-100%)' : undefined,
          }}
        >
          <div className="relative rounded-[10px] border border-white bg-[#1c1c1c] px-3 py-2.5 pr-9 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <p className="text-sm text-white">{tip.copy}</p>
            <button
              type="button"
              aria-label="Close"
              onClick={dismissOwnerTestGuide}
              className="pointer-events-auto absolute right-1 top-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden />
            </button>
            <span
              aria-hidden
              className="absolute h-2.5 w-2.5 rotate-45 border border-white bg-[#1c1c1c]"
              style={{
                left: tip.caret,
                top: tip.placeAbove ? undefined : -6,
                bottom: tip.placeAbove ? -6 : undefined,
              }}
            />
            <span
              aria-hidden
              className="absolute h-2.5 w-2.5 rotate-45 bg-[#1c1c1c]"
              style={{
                left: tip.caret,
                top: tip.placeAbove ? undefined : -4,
                bottom: tip.placeAbove ? -4 : undefined,
              }}
            />
          </div>
        </div>
      ))}
    </>,
    document.body
  );
}
