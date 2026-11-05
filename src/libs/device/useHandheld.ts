'use client';

import { useSyncExternalStore } from 'react';

import { detectClass } from './detectDevice';

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean | null {
  return (
    detectClass(navigator.userAgent, navigator.maxTouchPoints) !== 'desktop'
  );
}

function getServerSnapshot(): boolean | null {
  return null;
}

/** Phone or tablet. Null until the browser is known, so desktop and mobile do not swap after paint. */
export function useHandheld(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
