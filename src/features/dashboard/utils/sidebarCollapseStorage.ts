import { DASHBOARD_SIDEBAR_COLLAPSED_KEY } from '../constants/sidebar';

export function readSidebarCollapsed(
  storage: Pick<Storage, 'getItem'>
): boolean {
  return storage.getItem(DASHBOARD_SIDEBAR_COLLAPSED_KEY) === '1';
}

export function writeSidebarCollapsed(
  storage: Pick<Storage, 'setItem'>,
  collapsed: boolean
): void {
  storage.setItem(DASHBOARD_SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}
