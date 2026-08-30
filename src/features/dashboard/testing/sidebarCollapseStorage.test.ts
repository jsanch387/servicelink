import { describe, expect, it } from 'vitest';
import { DASHBOARD_SIDEBAR_COLLAPSED_KEY } from '../constants/sidebar';
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from '../utils/sidebarCollapseStorage';

describe('sidebarCollapseStorage', () => {
  it('treats missing values as expanded', () => {
    const storage = { getItem: () => null };
    expect(readSidebarCollapsed(storage)).toBe(false);
  });

  it('reads a collapsed flag', () => {
    const storage = {
      getItem: (key: string) =>
        key === DASHBOARD_SIDEBAR_COLLAPSED_KEY ? '1' : null,
    };
    expect(readSidebarCollapsed(storage)).toBe(true);
  });

  it('writes collapsed as 1', () => {
    const values = new Map<string, string>();
    writeSidebarCollapsed(
      { setItem: (key, value) => values.set(key, value) },
      true
    );
    expect(values.get(DASHBOARD_SIDEBAR_COLLAPSED_KEY)).toBe('1');
  });
});
