'use client';

import { ROUTES } from '@/constants/routes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import {
  parseSettingsTab,
  type SettingsTabId,
} from '../constants/settingsTabs';

export function useSettingsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseSettingsTab(searchParams.get('tab')),
    [searchParams]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#team') return;
    if (searchParams.get('tab') === 'team') return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'team');
    router.replace(`${ROUTES.DASHBOARD.SETTINGS}?${params.toString()}`, {
      scroll: false,
    });
  }, [router, searchParams]);

  const setTab = useCallback(
    (next: SettingsTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'team') {
        params.set('tab', 'team');
      } else {
        params.delete('tab');
      }
      const query = params.toString();
      router.replace(
        query
          ? `${ROUTES.DASHBOARD.SETTINGS}?${query}`
          : ROUTES.DASHBOARD.SETTINGS,
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  return { tab, setTab };
}
