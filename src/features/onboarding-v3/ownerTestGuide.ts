'use client';

import { useEffect, useState } from 'react';

/** Email and dashboard share this. `?practice=1` starts the practice-booking coach. */
export const OWNER_TEST_PRACTICE_PARAM = 'practice';

const KEY = 'servicelink.ownerTestGuide';
const DISMISS_KEY = 'servicelink.ownerTestGuideDismissed';
const EVENT = 'owner-test-guide';

/** Active step for this tab. Closing it is remembered in this browser. */
export type OwnerTestGuidePhase = 'public' | 'nav' | 'job' | 'complete';

export function readOwnerTestGuide(): OwnerTestGuidePhase | null {
  if (typeof sessionStorage === 'undefined') return null;
  const value = sessionStorage.getItem(KEY);
  if (
    value === 'public' ||
    value === 'nav' ||
    value === 'job' ||
    value === 'complete'
  ) {
    return value;
  }
  return null;
}

export function setOwnerTestGuide(phase: OwnerTestGuidePhase | null): void {
  if (typeof sessionStorage === 'undefined') return;
  if (phase) sessionStorage.setItem(KEY, phase);
  else sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function readOwnerTestGuideDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DISMISS_KEY) === '1';
}

/** Closes every coach mark and keeps them closed on this browser. */
export function dismissOwnerTestGuide(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, '1');
  }
  setOwnerTestGuide(null);
}

export function startOwnerTestGuide(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DISMISS_KEY);
  }
  setOwnerTestGuide('public');
}

export function subscribeOwnerTestGuide(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useOwnerTestGuidePhase(): OwnerTestGuidePhase | null {
  const [phase, setPhase] = useState<OwnerTestGuidePhase | null>(null);

  useEffect(() => {
    setPhase(readOwnerTestGuide());
    return subscribeOwnerTestGuide(() => setPhase(readOwnerTestGuide()));
  }, []);

  return phase;
}
