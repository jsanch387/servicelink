import { ADS_WORKSHOP_ACCESS_STORAGE_KEY } from '../constants';

export function hasAdsWorkshopAccess(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ADS_WORKSHOP_ACCESS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function grantAdsWorkshopAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADS_WORKSHOP_ACCESS_STORAGE_KEY, '1');
  } catch {
    // Ignore quota / private mode — UI still unlocks for this session via React state.
  }
}
