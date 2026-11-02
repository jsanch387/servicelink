'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from '../utils/sidebarCollapseStorage';

export function useDashboardSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      setCollapsedState(readSidebarCollapsed(window.localStorage));
    } catch {
      // private mode / blocked storage
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (collapsed) {
      root.setAttribute('data-sidebar-collapsed', '');
    } else {
      root.removeAttribute('data-sidebar-collapsed');
    }
    return () => root.removeAttribute('data-sidebar-collapsed');
  }, [collapsed]);

  const setCollapsed = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setCollapsedState(prev => {
        const value = typeof next === 'function' ? next(prev) : next;
        try {
          writeSidebarCollapsed(window.localStorage, value);
        } catch {
          // private mode / blocked storage
        }
        return value;
      });
    },
    []
  );

  return { collapsed, setCollapsed };
}
