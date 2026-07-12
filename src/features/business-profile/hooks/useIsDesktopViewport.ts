'use client';

import { useSyncExternalStore } from 'react';

function subscribeDesktopMq(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(min-width: 640px)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getDesktopMqSnapshot(): boolean {
  return window.matchMedia('(min-width: 640px)').matches;
}

export function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(
    subscribeDesktopMq,
    getDesktopMqSnapshot,
    () => false
  );
}
